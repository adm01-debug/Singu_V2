import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Registra/lista respostas sugeridas que o vendedor já marcou como "aplicadas"
 * em alguma negociação. Permite ao usuário acompanhar quais scripts já usou,
 * sem depender de criar uma interação completa.
 */

export interface AppliedResponse {
  id: string;
  user_id: string;
  objection: string;
  category: string | null;
  response_text: string | null;
  interaction_id: string | null;
  note: string | null;
  applied_at: string;
}

const QUERY_KEY = ["applied-objection-responses"] as const;

/** Normaliza a objeção para case/acento-insensível (matching client-side). */
export function normalizeObjection(value: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function useAppliedResponses() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery<AppliedResponse[]>({
    queryKey: [...QUERY_KEY, user?.id ?? "anon"],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applied_objection_responses")
        .select("id, user_id, objection, category, response_text, interaction_id, note, applied_at")
        .order("applied_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AppliedResponse[];
    },
  });

  /** Mapa: objeção normalizada -> aplicações (mais recente primeiro). */
  const indexByObjection = useMemo(() => {
    const map = new Map<string, AppliedResponse[]>();
    for (const row of list.data ?? []) {
      const key = normalizeObjection(row.objection);
      const arr = map.get(key);
      if (arr) arr.push(row);
      else map.set(key, [row]);
    }
    return map;
  }, [list.data]);

  const getByObjection = useCallback(
    (objection: string): AppliedResponse[] =>
      indexByObjection.get(normalizeObjection(objection)) ?? [],
    [indexByObjection],
  );

  const markApplied = useMutation({
    mutationFn: async (input: {
      objection: string;
      category?: string | null;
      responseText?: string | null;
      interactionId?: string | null;
      note?: string | null;
    }) => {
      if (!user?.id) throw new Error("Sessão expirada");
      const { data, error } = await supabase
        .from("applied_objection_responses")
        .insert({
          user_id: user.id,
          objection: input.objection,
          category: input.category ?? null,
          response_text: input.responseText ?? null,
          interaction_id: input.interactionId ?? null,
          note: input.note ?? null,
        })
        .select("id, user_id, objection, category, response_text, interaction_id, note, applied_at")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao registrar aplicação de resposta");
      return data as AppliedResponse;
    },
    onSuccess: (row) => {
      qc.setQueryData<AppliedResponse[] | undefined>(
        [...QUERY_KEY, user?.id ?? "anon"],
        (prev) => (prev ? [row, ...prev] : [row]),
      );
      toast.success("Resposta marcada como aplicada", {
        description: "Você pode acompanhar nas suas aplicações recentes.",
      });
    },
    onError: (err) => {
      toast.error("Não foi possível registrar a aplicação", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const unmark = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("applied_objection_responses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.setQueryData<AppliedResponse[] | undefined>(
        [...QUERY_KEY, user?.id ?? "anon"],
        (prev) => (prev ? prev.filter((r) => r.id !== id) : prev),
      );
      toast.success("Aplicação removida");
    },
    onError: (err) => {
      toast.error("Não foi possível remover a aplicação", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  return {
    list,
    getByObjection,
    markApplied,
    unmark,
  };
}
