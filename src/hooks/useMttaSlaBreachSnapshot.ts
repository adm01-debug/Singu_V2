import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SLA_MINUTES = 30;
const BASE_DEDUP_KEY = "mtta_sla_breach_snapshot_day";
const BASE_ALERT_DEDUP_KEY = "mtta_sla_breach_alert_day";

/**
 * Registra um snapshot em `system_health_snapshots` quando o MTTA crítico
 * ultrapassa o SLA. Dedup por dia (localStorage) para evitar flood — cada
 * dia calendário registra no máximo 1 snapshot por navegador.
 *
 * Requer admin autenticado (RLS `has_role('admin')`). Falhas silenciosas:
 * usuários não-admin apenas ignoram o insert.
 */
export function useMttaSlaBreachSnapshot(mttaCriticalMinutes: number | null): void {
  const { user } = useAuth();
  const inFlight = useRef(false);

  useEffect(() => {
    if (mttaCriticalMinutes === null || mttaCriticalMinutes <= SLA_MINUTES) return;
    if (inFlight.current) return;

    const uid = user?.id ?? 'anon';
    const DEDUP_KEY = `${BASE_DEDUP_KEY}-${uid}`;
    const ALERT_DEDUP_KEY = `${BASE_ALERT_DEDUP_KEY}-${uid}`;
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
    let aborted = false;
    void (async () => {
      try {
        if (needSnapshot && !aborted) {
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
          if (!error && !aborted) writeKey(DEDUP_KEY);
        }
        if (needAlert && !aborted) {
          // Publica alerta na trilha de auditoria (dedup 24h + auto-ack server-side).
          const { error } = await supabase.rpc("publish_mtta_sla_breach_alert", {
            _mtta_minutes: mttaCriticalMinutes,
            _sla_minutes: SLA_MINUTES,
          });
          if (!error && !aborted) writeKey(ALERT_DEDUP_KEY);
        }
      } finally {
        if (!aborted) inFlight.current = false;
      }
    })();
    return () => {
      aborted = true;
      inFlight.current = false;
    };
  }, [mttaCriticalMinutes, user]);
}