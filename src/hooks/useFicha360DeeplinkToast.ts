import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

interface Options {
  days: number;
  channels: string[];
  q: string;
  activeCount: number;
  /** Só dispara depois que dados carregaram, para não competir com skeleton. */
  ready: boolean;
}

function describe(days: number, channels: string[], q: string): string {
  const parts: string[] = [];
  if (days !== 90) parts.push(`período ${days}d`);
  if (channels.length > 0) {
    parts.push(channels.map((c) => CHANNEL_LABELS[c] ?? c).join(', '));
  }
  if (q) {
    const qTrimmed = q.length > 24 ? `${q.slice(0, 24)}…` : q;
    parts.push(`busca "${qTrimmed}"`);
  }
  return parts.join(' · ');
}

/**
 * Quando a Ficha 360 abre com filtros já presentes na URL (deep-link compartilhado),
 * dispara um toast informativo uma única vez por sessão de página.
 */
export function useFicha360DeeplinkToast({ days, channels, q, activeCount, ready }: Options) {
  const firedRef = useRef(false);
  // Snapshot de mount-only: usamos os valores iniciais para julgar "veio da URL".
  const initialActiveRef = useRef(activeCount);
  const initialSnapshotRef = useRef({ days, channels, q });

  useEffect(() => {
    if (firedRef.current) return;
    if (!ready) return;
    if (initialActiveRef.current === 0) {
      firedRef.current = true; // não tinha nada na URL; não dispara nem agora nem depois
      return;
    }
    const { days: d0, channels: c0, q: q0 } = initialSnapshotRef.current;
    const summary = describe(d0, c0, q0);
    toast.info('Filtros aplicados via link', {
      description: summary || undefined,
      duration: 2500,
    });
    firedRef.current = true;
  }, [ready]);
}
