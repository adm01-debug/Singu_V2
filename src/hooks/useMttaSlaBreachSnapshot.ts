import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SLA_MINUTES = 30;
const DEDUP_KEY = "mtta_sla_breach_snapshot_day";

/**
 * Registra um snapshot em `system_health_snapshots` quando o MTTA crítico
 * ultrapassa o SLA. Dedup por dia (localStorage) para evitar flood — cada
 * dia calendário registra no máximo 1 snapshot por navegador.
 *
 * Requer admin autenticado (RLS `has_role('admin')`). Falhas silenciosas:
 * usuários não-admin apenas ignoram o insert.
 */
export function useMttaSlaBreachSnapshot(mttaCriticalMinutes: number | null): void {
  const inFlight = useRef(false);

  useEffect(() => {
    if (mttaCriticalMinutes === null || mttaCriticalMinutes <= SLA_MINUTES) return;
    if (inFlight.current) return;

    const today = new Date().toISOString().slice(0, 10);
    let last: string | null = null;
    try {
      last = localStorage.getItem(DEDUP_KEY);
    } catch {
      // storage indisponível (SSR/private mode) — segue sem dedup
    }
    if (last === today) return;

    inFlight.current = true;
    void (async () => {
      try {
        const { error } = await supabase.from("system_health_snapshots").insert({
          status: "degraded",
          components: {
            source: "behavioral_regen_alerts",
            metric: "mtta_critical_minutes",
            value: mttaCriticalMinutes,
            sla_minutes: SLA_MINUTES,
            breach: true,
          },
        });
        if (!error) {
          try {
            localStorage.setItem(DEDUP_KEY, today);
          } catch {
            /* noop */
          }
        }
      } finally {
        inFlight.current = false;
      }
    })();
  }, [mttaCriticalMinutes]);
}