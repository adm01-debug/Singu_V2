import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ConversationAnalysis } from "@/hooks/useConversationIntel";

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

interface Vars {
  /** Texto canônico da objeção a ser marcada como tratada (match por texto normalizado). */
  objection: string;
  /** Marcar como tratada (true) ou reabrir (false). Default: true. */
  handled?: boolean;
}

interface AnalysisObjection {
  objection: string;
  category: string;
  handled: boolean;
  suggested_response?: string;
}

/**
 * Atualiza o flag `handled` de uma objeção (match por texto normalizado) em
 * TODAS as analyses do usuário que a contêm. Faz optimistic update no cache do
 * `conversation-analyses` para refletir a nova taxa de tratamento em tempo real
 * em todos os componentes que dependem de `useInteractionsInsights`.
 */
export function useMarkObjectionHandled() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ objection, handled = true }: Vars) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const target = normalize(objection);

      // Busca apenas analyses cujo array `objections` contém algum item — filtro
      // seguro pelo `user_id` (o RLS já restringe, mas mantemos explícito).
      const { data, error } = await supabase
        .from("conversation_analyses")
        .select("id, objections")
        .eq("user_id", user.id)
        .limit(1000);
      if (error) throw error;
      if (!Array.isArray(data) || data.length === 0) return { updated: 0, matched: 0 };

      // Calcula apenas as linhas que precisam realmente mudar (idempotente).
      const updates: Array<{ id: string; objections: AnalysisObjection[] }> = [];
      let matchedRows = 0;
      for (const row of data) {
        const arr = (row.objections as unknown as AnalysisObjection[] | null) ?? [];
        if (!Array.isArray(arr) || arr.length === 0) continue;
        let touched = false;
        let matchedHere = false;
        const next = arr.map((o) => {
          if (!o?.objection) return o;
          if (normalize(o.objection) !== target) return o;
          matchedHere = true;
          if (o.handled === handled) return o;
          touched = true;
          return { ...o, handled };
        });
        if (matchedHere) matchedRows += 1;
        if (touched) updates.push({ id: row.id as string, objections: next });
      }

      if (updates.length === 0) return { updated: 0, matched: matchedRows };

      // Updates em paralelo — o RLS garante que só linhas do próprio usuário
      // serão afetadas. Usamos Promise.allSettled para tolerar falhas parciais.
      const results = await Promise.allSettled(
        updates.map((u) =>
          supabase
            .from("conversation_analyses")
            .update({ objections: u.objections as unknown as never })
            .eq("id", u.id)
            .eq("user_id", user.id),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error));
      if (failed.length === updates.length) {
        throw new Error("Falha ao atualizar objeções no servidor");
      }
      return { updated: updates.length - failed.length, matched: matchedRows, failed: failed.length };
    },

    onMutate: async ({ objection, handled = true }) => {
      const target = normalize(objection);
      // Optimistic update em todas as queries `conversation-analyses` em cache
      // (cobre os 3 períodos: 7d/30d/90d).
      await qc.cancelQueries({ queryKey: ["conversation-analyses"] });
      const snapshots: Array<[readonly unknown[], unknown]> = [];
      const queries = qc.getQueriesData<ConversationAnalysis[]>({ queryKey: ["conversation-analyses"] });
      for (const [key, value] of queries) {
        snapshots.push([key, value]);
        if (!Array.isArray(value)) continue;
        const nextList = value.map((a) => {
          if (!Array.isArray(a.objections) || a.objections.length === 0) return a;
          const objs = a.objections as AnalysisObjection[];
          let changed = false;
          const nextObjs = objs.map((o) => {
            if (!o?.objection || normalize(o.objection) !== target) return o;
            if (o.handled === handled) return o;
            changed = true;
            return { ...o, handled };
          });
          return changed ? { ...a, objections: nextObjs } : a;
        });
        qc.setQueryData(key, nextList);
      }
      return { snapshots };
    },

    onError: (err, _vars, ctx) => {
      // Restaura todos os snapshots em caso de erro total.
      if (ctx?.snapshots) {
        for (const [key, value] of ctx.snapshots) qc.setQueryData(key, value);
      }
      toast.error("Não foi possível atualizar a objeção", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },

    onSuccess: (res, vars) => {
      if (!res || res.matched === 0) {
        toast.warning("Nenhuma análise encontrada para esta objeção");
        return;
      }
      if (res.updated === 0) {
        toast.info(vars.handled === false ? "Objeção já estava como pendente" : "Objeção já estava marcada como tratada");
        return;
      }
      toast.success(
        vars.handled === false ? "Objeção reaberta" : "Objeção marcada como tratada",
        { description: `${res.updated} análise${res.updated > 1 ? "s" : ""} atualizada${res.updated > 1 ? "s" : ""}.` },
      );
    },

    onSettled: () => {
      // Garante consistência com o servidor (revalida quando idle).
      qc.invalidateQueries({ queryKey: ["conversation-analyses"] });
    },
  });
}
