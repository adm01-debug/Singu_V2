import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { Database } from 'lucide-react';

type Source = 'live' | 'cache' | 'stale';

const STALE_MS = 60_000;

/**
 * Indicador de fonte de dados na status bar:
 * - LIVE: query em andamento agora
 * - CACHE: dados servidos do cache (<60s)
 * - STALE: dados >60s sem refresh
 */
export const IntelDataSourceBadge = () => {
  const fetching = useIsFetching();
  const [lastFetchEnd, setLastFetchEnd] = useState<number>(Date.now());
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (fetching === 0) setLastFetchEnd(Date.now());
  }, [fetching]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  const ageMs = now - lastFetchEnd;
  const source: Source = fetching > 0 ? 'live' : ageMs > STALE_MS ? 'stale' : 'cache';

  const sev = source === 'live' ? 'sev-ok' : source === 'cache' ? 'sev-warn' : 'sev-critical';
  const colorClass = `text-[hsl(var(--${sev}))]`;
  const tooltip =
    source === 'live'
      ? 'Dados em sincronização com o backend agora'
      : source === 'cache'
      ? `Servido do cache (${Math.round(ageMs / 1000)}s)`
      : `Cache antigo (${Math.round(ageMs / 1000)}s) — considere refresh`;

  return (
    <span className="hidden md:flex items-center gap-1.5" title={tooltip}>
      <Database className={`h-3 w-3 ${colorClass}`} aria-hidden />
      <span>
        DB:<span className={colorClass}>{source.toUpperCase()}</span>
      </span>
    </span>
  );
};
