import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export type BulkRevalidateKind = "email" | "phone" | "both";
export type BulkRevalidateStatus = "valid" | "invalid" | "risky" | "unknown" | "never";

export interface BulkRevalidateFilters {
  kind: BulkRevalidateKind;
  statuses: BulkRevalidateStatus[];
  olderThanDays: number;
  limit: number;
}

export interface BulkRevalidateResult {
  enqueued?: number;
  dryRun?: boolean;
  emails: number;
  phones: number;
  total: number;
  cappedAt: number;
}

export function useBulkRevalidatePreview(filters: BulkRevalidateFilters, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bulk-revalidate-preview", user?.id, filters],
    enabled: !!user && enabled && filters.statuses.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<BulkRevalidateResult> => {
      const { data, error } = await supabase.functions.invoke("bulk-revalidate", {
        body: { ...filters, dryRun: true },
      });
      if (error) throw error;
      return data as BulkRevalidateResult;
    },
  });
}

export function useBulkRevalidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filters: BulkRevalidateFilters): Promise<BulkRevalidateResult> => {
      const { data, error } = await supabase.functions.invoke("bulk-revalidate", {
        body: { ...filters, dryRun: false },
      });
      if (error) throw error;
      return data as BulkRevalidateResult;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["validation-queue-stats"] });
      qc.invalidateQueries({ queryKey: ["bulk-revalidate-preview"] });
      const n = data.enqueued ?? 0;
      if (n === 0) {
        toast.info("Nenhum item se encaixou nos filtros — fila não foi alterada");
      } else {
        toast.success(`📋 ${n} validação(ões) enfileirada(s)`, {
          description: "O worker processa em até 5 min ou clique em 'Processar agora'.",
          action: {
            label: "Ver fila",
            onClick: () => {
              const el = document.getElementById("validation-queue-card");
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            },
          },
        });
      }
    },
    onError: (err) => {
      logger.error("bulk-revalidate error", err);
      toast.error("Erro ao enfileirar revalidações");
    },
  });
}
