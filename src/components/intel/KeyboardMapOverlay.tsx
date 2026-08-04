import { useEffect, useState } from 'react';
import { Keyboard, X, PlayCircle } from 'lucide-react';
import { useIntelTour } from '@/hooks/useIntelTour';

interface Shortcut {
  keys: string[];
  desc: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['G'], desc: 'Ir para Graph' },
  { keys: ['E'], desc: 'Ir para Entity 360' },
  { keys: ['C'], desc: 'Ir para Cross-Ref' },
  { keys: ['A'], desc: 'Ir para Ask' },
  { keys: ['⌘', 'K'], desc: 'Focar input do Ask' },
  { keys: ['⌘', 'P'], desc: 'Abrir command palette' },
  { keys: ['Alt', '←'], desc: 'Voltar entidade no Entity 360' },
  { keys: ['Alt', '→'], desc: 'Avançar entidade no Entity 360' },
  { keys: ['R'], desc: 'Re-executar última query do Ask' },
  { keys: ['Shift', 'Click'], desc: 'Quick-pivot: abrir command palette com ações' },
  { keys: ['?'], desc: 'Abrir este painel de atalhos' },
  { keys: ['Esc'], desc: 'Fechar este painel' },
];

/**
 * Overlay modal listando todos os atalhos do Intelligence Hub.
 * Aberto via tecla "?" (fora de inputs), fechado via Esc ou clique no fundo.
 */
export const KeyboardMapOverlay = () => {
  const [open, setOpen] = useState(false);
  const { reopen: reopenTour } = useIntelTour();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable;

      if (!open && !isInput && (e.key === '?' || (e.key === '/' && e.shiftKey))) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (open && e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mapa de atalhos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="intel-card intel-corner-frame max-w-md w-full p-4 bg-[hsl(var(--intel-surface-1))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[hsl(var(--intel-accent))]" aria-hidden />
            <span className="intel-mono text-xs uppercase text-foreground">KEYBOARD_MAP</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <ul className="space-y-1">
          {SHORTCUTS.map((s) => (
            <li
              key={s.keys.join('+') + s.desc}
              className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0"
            >
              <span className="text-foreground">{s.desc}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={`${k}-${i}`}
                    className="intel-mono text-[10px] px-1.5 py-0.5 border border-border bg-muted/40 rounded-sm min-w-[20px] text-center"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { reopenTour(); setOpen(false); }}
            className="intel-mono text-[10px] inline-flex items-center gap-1 px-2 py-1 border border-border rounded-sm text-foreground hover:border-[hsl(var(--intel-accent))] hover:text-[hsl(var(--intel-accent))]"
            aria-label="Replay onboarding tour"
          >
            <PlayCircle className="h-3 w-3" aria-hidden /> REPLAY TOUR
          </button>
          <p className="intel-mono text-[10px] text-muted-foreground">
            ── <kbd className="px-1 border border-border rounded-sm">Esc</kbd> FECHAR ──
          </p>
        </div>
      </div>
    </div>
  );
};
