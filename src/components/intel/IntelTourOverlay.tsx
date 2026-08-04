import { useEffect, useState } from 'react';
import { useIntelTour } from '@/hooks/useIntelTour';
import { ChevronRight, X } from 'lucide-react';

interface TourStep {
  title: string;
  desc: string;
  hint: string;
}

const STEPS: TourStep[] = [
  {
    title: 'HEADER · COMANDOS',
    desc: 'Aqui estão snapshot, presentation, density e o command palette (⌘P). Tudo persiste entre sessões.',
    hint: 'Pressione ? a qualquer momento para ver todos os atalhos.',
  },
  {
    title: 'TABS · 4 MODOS DE INVESTIGAÇÃO',
    desc: 'Graph, Entity 360, Cross-Ref e Ask. Use as teclas G / E / C / A para alternar instantaneamente.',
    hint: 'A URL guarda a tab ativa — links funcionam como bookmarks.',
  },
  {
    title: 'ASIDE · PINS & SNAPSHOTS',
    desc: 'Bookmarks (★) e snapshots ficam aqui. Shift+click em um pin foca a entidade no Graph.',
    hint: 'Use SNAPSHOT no header para salvar e compartilhar a sessão.',
  },
  {
    title: 'STATUS BAR · TELEMETRIA',
    desc: 'Latência, fonte de dados, queries em voo e contadores. Adicione ?debug=1 ou ?diag=1 para ver mais.',
    hint: 'Bom proveito! Você pode reabrir este tour pela tecla ? > "Tour".',
  },
];

/**
 * Overlay de onboarding de 4 passos exibido no primeiro acesso ao /intelligence.
 * Persistido em localStorage via useIntelTour.
 */
export const IntelTourOverlay = () => {
  const { open, complete, setOpen } = useIntelTour();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); }
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tour do Intelligence Hub"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="intel-card intel-corner-frame max-w-md w-full p-4 bg-[hsl(var(--intel-surface-1))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <span className="intel-eyebrow text-foreground">
            ONBOARDING · {String(step + 1).padStart(2, '0')}/{String(STEPS.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar tour"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <h2 className="intel-mono text-sm text-foreground mb-2">{current.title}</h2>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{current.desc}</p>
        <p className="intel-mono text-[10px] text-[hsl(var(--intel-accent))]">▸ {current.hint}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-6 rounded-full ${
                  i === step ? 'bg-[hsl(var(--intel-accent))]' : 'bg-[hsl(var(--intel-border))]'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="intel-mono text-[10px] px-2 py-1 border border-border rounded-sm disabled:opacity-40 hover:border-[hsl(var(--intel-accent))]"
            >
              ANTERIOR
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={complete}
                className="intel-mono text-[10px] px-2 py-1 border border-[hsl(var(--intel-accent))] text-[hsl(var(--intel-accent))] rounded-sm hover:bg-[hsl(var(--intel-accent)/0.1)]"
              >
                COMEÇAR
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                className="intel-mono text-[10px] px-2 py-1 border border-[hsl(var(--intel-accent))] text-[hsl(var(--intel-accent))] rounded-sm hover:bg-[hsl(var(--intel-accent)/0.1)] inline-flex items-center gap-1"
              >
                PRÓXIMO <ChevronRight className="h-3 w-3" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
