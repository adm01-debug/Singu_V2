import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";

interface Step {
  type: "email" | "whatsapp" | "task" | "wait";
  delay_days?: number;
  subject?: string;
  content?: string;
  template_id?: string;
}

interface WorkflowRow {
  id: string;
  steps: unknown;
  completed_count?: number;
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const stats = { processed: 0, advanced: 0, completed: 0, failed: 0 };

  try {
    const { data: execs, error } = await supabase
      .from("nurturing_executions")
      .select("id, user_id, workflow_id, contact_id, current_step, context")
      .eq("status", "active")
      .lte("next_action_at", new Date().toISOString())
      .limit(100);

    if (error) throw error;
    if (!execs || execs.length === 0) {
      return new Response(JSON.stringify({ ok: true, stats }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Pre-batch: fetch all unique workflows in one query instead of N individual fetches
    const workflowIds = [...new Set(execs.map((e: { workflow_id: string }) => e.workflow_id))];
    const { data: workflowRows } = await supabase
      .from("nurturing_workflows")
      .select("id, steps, completed_count")
      .in("id", workflowIds);

    const workflowMap = new Map(
      (workflowRows ?? []).map((w: WorkflowRow) => [w.id, w])
    );

    const now = new Date().toISOString();

    // Accumulators for bulk writes after the loop
    const taskRows: never[] = [];
    const interactionRows: never[] = [];
    const completedExecIds: string[] = [];
    const advanceExecRows: Array<{ id: string; current_step: number; last_action_at: string; next_action_at: string | null; status: string; completed_at: string | null }> = [];
    const failedExecRows: Array<{ id: string; status: string; error_message: string }> = [];
    const completedWorkflowIds: string[] = [];

    for (const exec of execs) {
      stats.processed++;
      try {
        const wf = workflowMap.get(exec.workflow_id) as WorkflowRow | undefined;
        const steps: Step[] = Array.isArray(wf?.steps) ? (wf!.steps as unknown as Step[]) : [];
        const step = steps[exec.current_step];

        if (!step) {
          completedExecIds.push(exec.id);
          completedWorkflowIds.push(exec.workflow_id);
          stats.completed++;
          continue;
        }

        if (step.type === "task") {
          taskRows.push({
            user_id: exec.user_id,
            contact_id: exec.contact_id,
            title: step.subject || "Tarefa de nurturing",
            description: step.content || null,
            status: "pending",
            priority: "medium",
          } as never);
        } else if (step.type === "email" || step.type === "whatsapp") {
          interactionRows.push({
            user_id: exec.user_id,
            contact_id: exec.contact_id,
            type: step.type === "email" ? "email" : "whatsapp",
            title: step.subject || `Nurturing ${step.type}`,
            content: step.content || "",
            initiated_by: "user",
          } as never);
        }

        const nextStep = exec.current_step + 1;
        const nextStepDef = steps[nextStep];
        const delayDays = nextStepDef?.delay_days ?? 1;
        const nextAt = new Date(Date.now() + delayDays * 86_400_000).toISOString();

        advanceExecRows.push({
          id: exec.id,
          current_step: nextStep,
          last_action_at: now,
          next_action_at: nextStepDef ? nextAt : null,
          status: nextStepDef ? "active" : "completed",
          completed_at: nextStepDef ? null : now,
        });
        stats.advanced++;
      } catch (stepErr) {
        stats.failed++;
        failedExecRows.push({
          id: exec.id,
          status: "failed",
          error_message: (stepErr as Error).message,
        });
      }
    }

    // Flush all accumulated writes in parallel
    await Promise.all([
      taskRows.length > 0
        ? bestEffortWrite(supabase.from("tasks").insert(taskRows), "tasks insert error:")
        : Promise.resolve(),
      interactionRows.length > 0
        ? bestEffortWrite(supabase.from("interactions").insert(interactionRows), "interactions insert error:")
        : Promise.resolve(),
      completedExecIds.length > 0
        ? supabase.from("nurturing_executions").update({ status: "completed", completed_at: now }).in("id", completedExecIds)
        : Promise.resolve(),
      advanceExecRows.length > 0
        ? supabase.from("nurturing_executions").upsert(advanceExecRows, { onConflict: "id" })
        : Promise.resolve(),
      failedExecRows.length > 0
        ? supabase.from("nurturing_executions").upsert(failedExecRows, { onConflict: "id" })
        : Promise.resolve(),
      // Workflow completion RPCs run in parallel (one per completed workflow)
      ...completedWorkflowIds.map(wfId =>
        bestEffortWrite(supabase.rpc("increment_workflow_completed", { _id: wfId }), "workflow completion error:")
      ),
    ]);

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nurturing-runner error:", e);
    return new Response(JSON.stringify({ error: "Internal server error", stats }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
