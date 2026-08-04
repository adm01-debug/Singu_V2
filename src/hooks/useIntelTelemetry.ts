import { useCallback, useEffect, useRef, useState } from 'react';

export interface IntelTelemetryEvent {
  ts: number;
  kind: 'tab_view' | 'query' | 'export' | 'command' | 'error';
  label: string;
  durationMs?: number;
  meta?: Record<string, string | number | boolean>;
}

const STORAGE_KEY = 'intel-telemetry-v1';
const MAX_EVENTS = 100;

function readEvents(): IntelTelemetryEvent[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IntelTelemetryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: IntelTelemetryEvent[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* ignore */
  }
}

/**
 * Telemetria local (sessionStorage) para o Intelligence Hub.
 * Não envia nada à rede. Útil para diagnóstico via ?debug=1.
 */
export function useIntelTelemetry() {
  const [events, setEvents] = useState<IntelTelemetryEvent[]>(() => readEvents());
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const log = useCallback((ev: Omit<IntelTelemetryEvent, 'ts'>) => {
    const next: IntelTelemetryEvent = { ts: Date.now(), ...ev };
    const updated = [...eventsRef.current, next].slice(-MAX_EVENTS);
    eventsRef.current = updated;
    writeEvents(updated);
    setEvents(updated);
    if (import.meta.env.DEV) {
      console.debug('[intel.telemetry]', next);
    }
  }, []);

  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setEvents([]);
  }, []);

  const stats = useCallback(() => {
    const all = eventsRef.current;
    const byKind = all.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] || 0) + 1;
      return acc;
    }, {});
    const durations = all.filter((e) => typeof e.durationMs === 'number').map((e) => e.durationMs!);
    const avgMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    return { total: all.length, byKind, avgMs };
  }, []);

  return { events, log, clear, stats };
}

/**
 * Hook auxiliar para registrar uma tab view sempre que `tab` mudar.
 */
export function useIntelTabView(tab: string, log: ReturnType<typeof useIntelTelemetry>['log']) {
  useEffect(() => {
    log({ kind: 'tab_view', label: tab });
  }, [tab, log]);
}
