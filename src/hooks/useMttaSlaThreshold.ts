import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SLA_MIN = 30;

/**
 * Lê o SLA de MTTA crítico configurado em `system_config`
 * (chave `mtta_critical_sla_min`). Fallback: 30 minutos.
 * Cache de 5min — mudanças propagam sem F5 pesado.
 */
export function useMttaSlaThreshold(): number {
  const { data } = useQuery({
    queryKey: ["system-config", "mtta_critical_sla_min"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "mtta_critical_sla_min")
        .maybeSingle();
      if (error || !data) return DEFAULT_SLA_MIN;
      const n = Number(data.value);
      return Number.isFinite(n) && n > 0 ? n : DEFAULT_SLA_MIN;
    },
  });
  return data ?? DEFAULT_SLA_MIN;
}