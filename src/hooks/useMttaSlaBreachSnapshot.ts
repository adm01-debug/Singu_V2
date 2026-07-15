import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SLA_MINUTES = 30;
const DEDUP_KEY = "mtta_sla_breach_snapshot_day";
const ALERT_DEDUP_KEY = "mtta_sla_breach_alert_day";

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
    const readKey = (k: string): string | null => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    };
    const writeKey = (k: string): void => {
      try {
        localStorage.setItem(k, today);
      } catch {
        /* noop */
      }
    };
    const needSnapshot = readKey(DEDUP_KEY) !== today;
    const needAlert = readKey(ALERT_DEDUP_KEY) !== today;
    if (!needSnapshot && !needAlert) return;

    inFlight.current = true;
    void (async () => {
      try {
        if (needSnapshot) {
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
          if (!error) writeKey(DEDUP_KEY);
        }
        if (needAlert) {
          // Publica alerta na trilha de auditoria (dedup 24h + auto-ack server-side).
          const { error } = await supabase.rpc("publish_mtta_sla_breach_alert", {
            _mtta_minutes: mttaCriticalMinutes,
            _sla_minutes: SLA_MINUTES,
          });
          if (!error) writeKey(ALERT_DEDUP_KEY);
        }
      } finally {
        inFlight.current = false;
      }
    })();
  }, [mttaCriticalMinutes]);
}