import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { IntelTelemetryPanel } from './IntelTelemetryPanel';
import { IntelLatencyBadge } from './IntelLatencyBadge';
import { IntelDataSourceBadge } from './IntelDataSourceBadge';
import { IntelInflightBadge } from './IntelInflightBadge';
import { IntelBookmarksNotesBadge } from './IntelBookmarksNotesBadge';

/**
 * Barra de status fixa no rodapé do Intelligence Hub.
 * Mostra: estado online, queries em andamento, último refresh, painel de debug (?debug=1).
 */
export const IntelStatusBar = () => {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const [params] = useSearchParams();
  const debug = params.get('debug') === '1';
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
    };
  }, []);

  useEffect(() => {
    if (fetching === 0) setLastRefresh(new Date());
  }, [fetching]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ageSec = Math.max(0, Math.floor((now - lastRefresh.getTime()) / 1000));
  const ageLabel = ageSec < 60 ? `${ageSec}s` : `${Math.floor(ageSec / 60)}m`;

  return (
    <div
      role="status"
      aria-live="polite"
      data-intel-hide-pres="true"
      className="sticky bottom-0 left-0 right-0 z-10 mt-3 -mx-4 md:-mx-6 border-t border-border bg-[hsl(var(--intel-bg)/0.95)] backdrop-blur"
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-1.5 flex items-center justify-between intel-mono text-[10px] text-muted-foreground gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5">
            {online ? (
              <Wifi className="h-3 w-3 text-[hsl(var(--intel-accent))]" aria-hidden />
            ) : (
              <WifiOff className="h-3 w-3 text-destructive" aria-hidden />
            )}
            <span>{online ? 'ONLINE' : 'OFFLINE'}</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Activity
              className={`h-3 w-3 ${fetching + mutating > 0 ? 'text-[hsl(var(--intel-accent))] animate-pulse' : 'text-muted-foreground'}`}
              aria-hidden
            />
            <span>QUERIES: {fetching} · MUT: {mutating}</span>
          </span>
          <IntelLatencyBadge />
          <IntelDataSourceBadge />
          <IntelInflightBadge />
          <IntelBookmarksNotesBadge />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="h-3 w-3" aria-hidden />
          <span>LAST_REFRESH: {ageLabel}</span>
        </div>
      </div>
      {debug && <IntelTelemetryPanel />}
    </div>
  );
};
