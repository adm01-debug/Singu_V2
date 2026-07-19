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

    for (const exec of execs) {
      stats.processed++;
      try {
        const wf = workflowMap.get(exec.workflow_id) as WorkflowRow | undefined;
        const steps: Step[] = Array.isArray(wf?.steps) ? (wf!.steps as unknown as Step[]) : [];
        const step = steps[exec.current_step];

        if (!step) {
          await supabase.from("nurturing_executions").update({
            status: "completed",
            completed_at: new Date().toISOString(),
          }).eq("id", exec.id);
          await supabase.rpc("increment_workflow_completed" as never, { _id: exec.workflow_id }).catch(() => {});
          await supabase.from("nurturing_workflows")
            .update({ completed_count: ((wf?.completed_count) ?? 0) + 1 } as never)
            .eq("id", exec.workflow_id).catch(() => {});
          stats.completed++;
          continue;
        }

        if (step.type === "task") {
          await supabase.from("tasks").insert({
            user_id: exec.user_id,
            contact_id: exec.contact_id,
            title: step.subject || "Tarefa de nurturing",
            description: step.content || null,
            status: "pending",
            priority: "medium",
          } as never).catch(() => {});
        } else if (step.type === "email" || step.type === "whatsapp") {
          await supabase.from("interactions").insert({
            user_id: exec.user_id,
            contact_id: exec.contact_id,
            type: step.type === "email" ? "email" : "whatsapp",
            title: step.subject || `Nurturing ${step.type}`,
            content: step.content || "",
            initiated_by: "user",
          } as never).catch(() => {});
        }

        const nextStep = exec.current_step + 1;
        const nextStepDef = steps[nextStep];
        const delayDays = nextStepDef?.delay_days ?? 1;
        const nextAt = new Date(Date.now() + delayDays * 86_400_000).toISOString();

        await supabase.from("nurturing_executions").update({
          current_step: nextStep,
          last_action_at: new Date().toISOString(),
          next_action_at: nextStepDef ? nextAt : null,
          status: nextStepDef ? "active" : "completed",
          completed_at: nextStepDef ? null : new Date().toISOString(),
        }).eq("id", exec.id);

        stats.advanced++;
      } catch (stepErr) {
        stats.failed++;
        await supabase.from("nurturing_executions").update({
          status: "failed",
          error_message: (stepErr as Error).message,
        }).eq("id", exec.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, stats }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
