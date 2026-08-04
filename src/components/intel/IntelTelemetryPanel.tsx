import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useIntelTelemetry, type IntelTelemetryEvent } from '@/hooks/useIntelTelemetry';

const KIND_COLOR: Record<IntelTelemetryEvent['kind'], string> = {
  tab_view: 'text-[hsl(var(--intel-accent))]',
  query: 'text-foreground',
  export: 'text-[hsl(var(--sev-ok))]',
  command: 'text-[hsl(var(--sev-info))]',
  error: 'text-destructive',
};

/**
 * Painel de telemetria oculto, só renderiza quando ?debug=1 está na URL.
 * Mostrado pelo IntelStatusBar.
 */
export const IntelTelemetryPanel = () => {
  const [open, setOpen] = useState(false);
  const { events, clear, stats } = useIntelTelemetry();
  const s = stats();

  return (
    <div className="border-t border-border bg-[hsl(var(--intel-bg)/0.97)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 intel-mono text-[10px] uppercase text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        <span>
          DEBUG · {s.total} EVT · AVG {s.avgMs}ms · TAB:{s.byKind.tab_view || 0} Q:{s.byKind.query || 0} EX:{s.byKind.export || 0} ERR:{s.byKind.error || 0}
        </span>
        {open ? <ChevronDown className="h-3 w-3" aria-hidden /> : <ChevronUp className="h-3 w-3" aria-hidden />}
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto border-t border-border/60 px-3 py-2">
          <div className="flex items-center justify-end mb-1">
            <button
              type="button"
              onClick={clear}
              className="intel-mono text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
              aria-label="Limpar telemetria"
            >
              <Trash2 className="h-3 w-3" aria-hidden /> CLEAR
            </button>
          </div>
          {events.length === 0 ? (
            <div className="intel-mono text-[10px] text-muted-foreground text-center py-2">── NO_EVENTS ──</div>
          ) : (
            <ul className="space-y-0.5">
              {events.slice().reverse().map((e, i) => (
                <li key={`${e.ts}-${i}`} className="intel-mono text-[10px] flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">
                    {new Date(e.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`${KIND_COLOR[e.kind]} w-16 shrink-0`}>{e.kind.toUpperCase()}</span>
                  <span className="text-foreground truncate flex-1">{e.label}</span>
                  {typeof e.durationMs === 'number' && (
                    <span className="text-muted-foreground shrink-0">{e.durationMs}ms</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
