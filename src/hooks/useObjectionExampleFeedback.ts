import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from './useAuth';

export interface ObjectionExampleFeedbackRow {
  id: string;
  objection: string;
  category: string | null;
  interaction_id: string;
  is_useful: boolean;
}

interface UseFeedbackOptions {
  objection: string | null;
  category?: string | null;
}

interface ToggleArgs {
  interactionId: string;
  isUseful: boolean;
}

/**
 * Carrega e gerencia o feedback "Útil" do usuário para os exemplos de uma
 * objeção. O sinal acumulado é consumido pelo gerador de respostas sugeridas
 * para priorizar conversas marcadas como úteis nas próximas sugestões.
 */
export function useObjectionExampleFeedback({ objection, category }: UseFeedbackOptions) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const enabled = !!objection;

  const queryKey = ["objection-example-feedback", objection ?? ""];

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    enabled,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ObjectionExampleFeedbackRow[]> => {
      const { data, error } = await supabase
        .from("objection_example_feedback")
        .select("id, objection, category, interaction_id, is_useful")
        .eq("objection", objection!);
      if (error) throw error;
      return (data ?? []) as ObjectionExampleFeedbackRow[];
    },
  });

  /** Map<interactionId, isUseful> para lookup O(1) na renderização. */
  const usefulByInteraction = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const r of rows) map.set(r.interaction_id, r.is_useful);
    return map;
  }, [rows]);

  const usefulCount = useMemo(
    () => rows.reduce((acc, r) => acc + (r.is_useful ? 1 : 0), 0),
    [rows],
  );

  const toggle = useMutation({
    mutationFn: async ({ interactionId, isUseful }: ToggleArgs) => {
      if (!objection) throw new Error("Objeção ausente");
      const userId = user?.id;
      if (!userId) throw new Error("Você precisa estar autenticado.");

      if (!isUseful) {
        // Desmarcar = remover registro.
        const { error } = await supabase
          .from("objection_example_feedback")
          .delete()
          .eq("user_id", userId)
          .eq("objection", objection)
          .eq("interaction_id", interactionId);
        if (error) throw error;
        return { removed: true };
      }

      // Upsert via UNIQUE (user_id, objection, interaction_id).
      const { error } = await supabase
        .from("objection_example_feedback")
        .upsert(
          {
            user_id: userId,
            objection,
            category: category ?? null,
            interaction_id: interactionId,
            is_useful: true,
          },
          { onConflict: "user_id,objection,interaction_id" },
        );
      if (error) throw error;
      return { removed: false };
    },
    onMutate: async ({ interactionId, isUseful }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ObjectionExampleFeedbackRow[]>(queryKey) ?? [];
      const next = isUseful
        ? prev.some((r) => r.interaction_id === interactionId)
          ? prev.map((r) =>
              r.interaction_id === interactionId ? { ...r, is_useful: true } : r,
            )
          : [
              ...prev,
              {
                id: `optimistic-${interactionId}`,
                objection: objection ?? "",
                category: category ?? null,
                interaction_id: interactionId,
                is_useful: true,
              },
            ]
        : prev.filter((r) => r.interaction_id !== interactionId);
      qc.setQueryData(queryKey, next);
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o feedback.");
    },
    onSuccess: (_res, vars) => {
      toast.success(
        vars.isUseful
          ? "Marcada como útil — vamos priorizar exemplos parecidos."
          : "Marcação removida.",
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  return {
    isLoading,
    usefulByInteraction,
    usefulCount,
    toggle,
  };
}
