import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { createClient, FunctionsHttpError } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecretOrAuth } from "../_shared/auth.ts";

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

interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface ExecutionRow {
  id: string;
  user_id: string;
  workflow_id: string;
  contact_id: string;
  current_step: number;
  context: Record<string, unknown> | null;
}

type AdvanceRow = {
  id: string;
  current_step: number;
  last_action_at: string;
  next_action_at: string | null;
  status: string;
  completed_at: string | null;
  context?: Record<string, unknown>;
};

function buildNextActionAt(steps: Step[], currentStep: number): string | null {
  const next = steps[currentStep + 1];
  if (!next) return null;
  const delayDays = next.delay_days ?? 1;
  return new Date(Date.now() + delayDays * 86_400_000).toISOString();
}

function buildNextStatus(steps: Step[], currentStep: number): string {
  return steps[currentStep + 1] ? "active" : "completed";
}

async function isMissingEmailFunction(error: unknown): Promise<boolean> {
  if (!(error instanceof FunctionsHttpError) || error.context.status !== 404) return false;
  const body: unknown = await error.context.clone().json().catch(() => null);
  return body !== null && typeof body === "object" && "code" in body && body.code === "NOT_FOUND";
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const guard = await requireCronSecretOrAuth(req);
  if (guard instanceof Response) return guard;

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

    // Pre-batch: fetch all unique contacts in one query
    const contactIds = [...new Set(execs.map((e: { contact_id: string }) => e.contact_id))];
    const { data: contactRows } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email")
      .in("id", contactIds);
    const contactMap = new Map(
      (contactRows ?? []).map((c: ContactRow) => [c.id, c])
    );

    const now = new Date().toISOString();

    // Accumulators for bulk writes after the loop
    const taskRows: never[] = [];
    const interactionRows: never[] = [];
    const completedExecIds: string[] = [];
    const advanceExecRows: AdvanceRow[] = [];
    const failedExecRows: Array<{ id: string; status: string; error_message: string }> = [];
    const completedWorkflowIds: string[] = [];

    for (const exec of execs as ExecutionRow[]) {
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

        const isLastStep = !steps[exec.current_step + 1];

        if (step.type === "task") {
          taskRows.push({
            user_id: exec.user_id,
            contact_id: exec.contact_id,
            title: step.subject || "Tarefa de nurturing",
            description: step.content || null,
            status: "pending",
            priority: "medium",
          } as never);

          advanceExecRows.push({
            id: exec.id,
            current_step: exec.current_step + 1,
            last_action_at: now,
            next_action_at: buildNextActionAt(steps, exec.current_step),
            status: buildNextStatus(steps, exec.current_step),
            completed_at: steps[exec.current_step + 1] ? null : now,
          });
          if (isLastStep) {
            completedWorkflowIds.push(exec.workflow_id);
            stats.completed++;
          }
          stats.advanced++;
        } else if (step.type === "email") {
          // M14: envio de e-mail REAL via send-transactional-email (padrão sequence-processor).
          const context: Record<string, unknown> =
            exec.context && typeof exec.context === "object" ? { ...exec.context } : {};
          const newContext: Record<string, unknown> = {
            ...context,
            email_sent_step: context.email_sent_step ?? null,
            email_message_id: context.email_message_id ?? null,
            email_tracking_token: context.email_tracking_token ?? null,
          };

          if (context.email_sent_step === exec.current_step) {
            // Idempotência: este step de e-mail já foi enviado; registra apenas a interação
            interactionRows.push({
              user_id: exec.user_id,
              contact_id: exec.contact_id,
              type: "email",
              title: step.subject || "Nurturing email",
              content: step.content || "",
              initiated_by: "us",
            } as never);
          } else {
            const contact = contactMap.get(exec.contact_id) as ContactRow | undefined;
            if (!contact?.email || !contact.email.trim()) {
              throw new Error("Contato sem email para envio no nurturing");
            }

            const idempotencyKey = `nur-${exec.id}-step-${exec.current_step}`;
            const digest = await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(idempotencyKey)
            );
            const trackingToken = Array.from(new Uint8Array(digest), (byte) =>
              byte.toString(16).padStart(2, "0")
            ).join("").slice(0, 32);

            const { data: delivery, error: deliveryError } = await supabase.functions.invoke<{
              ok: boolean;
              messageId: string;
            }>("send-transactional-email", {
              signal: AbortSignal.timeout(20_000),
              body: {
                templateName: "nurturing-step",
                recipientEmail: contact.email.trim(),
                idempotencyKey,
                templateData: {
                  subject: step.subject || "Mensagem",
                  body: step.content || "",
                  trackingToken,
                },
              },
            });

            if (deliveryError) {
              const missing = await isMissingEmailFunction(deliveryError);
              if (!missing) throw new Error("Envio transacional não confirmado pelo provedor");
              throw new Error("send-transactional-email não disponível (NOT_FOUND)");
            }
            if (delivery?.ok !== true || typeof delivery.messageId !== "string" || !delivery.messageId.trim()) {
              throw new Error("Envio transacional não confirmado pelo provedor");
            }

            newContext.email_sent_step = exec.current_step;
            newContext.email_message_id = delivery.messageId;
            newContext.email_tracking_token = trackingToken;

            interactionRows.push({
              user_id: exec.user_id,
              contact_id: exec.contact_id,
              type: "email",
              title: step.subject || "Nurturing email",
              content: step.content || "",
              initiated_by: "us",
            } as never);
          }

          advanceExecRows.push({
            id: exec.id,
            current_step: exec.current_step + 1,
            last_action_at: now,
            next_action_at: buildNextActionAt(steps, exec.current_step),
            status: buildNextStatus(steps, exec.current_step),
            completed_at: steps[exec.current_step + 1] ? null : now,
            context: newContext,
          });
          if (isLastStep) {
            completedWorkflowIds.push(exec.workflow_id);
            stats.completed++;
          }
          stats.advanced++;
        } else if (step.type === "whatsapp") {
          interactionRows.push({
            user_id: exec.user_id,
            contact_id: exec.contact_id,
            type: "whatsapp",
            title: step.subject || "Nurturing whatsapp",
            content: step.content || "",
            initiated_by: "us",
          } as never);

          advanceExecRows.push({
            id: exec.id,
            current_step: exec.current_step + 1,
            last_action_at: now,
            next_action_at: buildNextActionAt(steps, exec.current_step),
            status: buildNextStatus(steps, exec.current_step),
            completed_at: steps[exec.current_step + 1] ? null : now,
          });
          if (isLastStep) {
            completedWorkflowIds.push(exec.workflow_id);
            stats.completed++;
          }
          stats.advanced++;
        } else {
          // wait step: delay já foi respeitado via next_action_at; avança imediatamente
          advanceExecRows.push({
            id: exec.id,
            current_step: exec.current_step + 1,
            last_action_at: now,
            next_action_at: buildNextActionAt(steps, exec.current_step),
            status: buildNextStatus(steps, exec.current_step),
            completed_at: steps[exec.current_step + 1] ? null : now,
          });
          stats.advanced++;
        }
      } catch (stepErr) {
        // Falha de envio: mantém execution ativa para retry no próximo tick; contato sem email
        // ou função de envio inexistente pausa a execução (evita retry infinito).
        const msg = (stepErr as Error).message;
        stats.failed++;
        if (msg.startsWith("Contato sem email") || msg.includes("NOT_FOUND")) {
          failedExecRows.push({
            id: exec.id,
            status: "paused",
            error_message: msg,
          });
        } else {
          console.error("nurturing-runner step falhou (retry no próximo tick):", msg);
        }
      }
    }

    // Flush all accumulated writes in parallel
    const dedupedCompletedWorkflowIds = [...new Set(completedWorkflowIds)];
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
      ...dedupedCompletedWorkflowIds.map(wfId =>
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
