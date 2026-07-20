import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface QueueStats {
  pending: number;
  processing: number;
  done: number;
  error: number;
  total: number;
}

export function useValidationQueueStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["validation-queue-stats", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    staleTime: 25_000,
    queryFn: async (): Promise<QueueStats> => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("validation_queue")
        .select("status")
        .eq("user_id", user!.id)
        .gte("created_at", since)
        .limit(1000);
      if (error) throw error;
      const stats: QueueStats = { pending: 0, processing: 0, done: 0, error: 0, total: 0 };
      (data ?? []).forEach((r: { status: string }) => {
        if (r.status in stats) stats[r.status as keyof QueueStats]++;
        stats.total++;
      });
      return stats;
    },
  });
}

export function useTriggerQueueWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("validation-queue-worker", { body: {} });
      if (error) throw error;
      return data as { processed: number; ok?: number; errors?: number; message?: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["validation-queue-stats"] });
      qc.invalidateQueries({ queryKey: ["email-verifications"] });
      qc.invalidateQueries({ queryKey: ["phone-validations"] });
      if (data.processed === 0) {
        toast.info("Fila vazia — nada a processar");
      } else {
        toast.success(`⚙️ ${data.processed} item(s) processado(s) (${data.ok ?? 0} ok, ${data.errors ?? 0} erros)`);
      }
    },
    onError: (err) => {
      logger.error("queue-worker error", err);
      toast.error("Erro ao processar fila");
    },
  });
}
