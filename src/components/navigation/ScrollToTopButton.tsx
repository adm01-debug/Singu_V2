import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  INFINITE_SCROLL_PROGRESS_EVENT,
  INFINITE_SCROLL_CLEAR_EVENT,
  type InfiniteScrollProgress,
} from '@/hooks/useReportInfiniteScrollProgress';
import { useListDensity } from '@/contexts/DensityContext';

interface ScrollToTopButtonProps {
  className?: string;
  /** Limiar (px) de scrollY para tornar o botão visível. Default 400. */
  threshold?: number;
  /**
   * Multiplicador aplicado ao threshold quando a densidade ambiente é
   * `compact`. Em listas compactas cabem ~50% mais itens por viewport, então
   * faz sentido o botão aparecer mais cedo. Default 0.7 (≈ 280px com threshold
   * default de 400). Use 1 para desabilitar o ajuste.
   */
  compactRatio?: number;
}

/**
 * Floating scroll-to-top button.
 * - Limiar adaptativo em listas longas (scrollHeight > 4000 → 300px).
 * - Limiar reduzido em densidade `compact` (multiplicado por `compactRatio`).
 * - Scroll instantâneo em rolagens muito altas (>5000) ou prefers-reduced-motion.
 * - Listener de scroll throttled via requestAnimationFrame.
 * - Hides when overlays (e.g., MobileBottomNav "More") are open.
 */
export function ScrollToTopButton({
  className,
  threshold = 400,
  compactRatio = 0.7,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [progress, setProgress] = useState<InfiniteScrollProgress | null>(null);
  const rafRef = useRef<number | null>(null);
  const density = useListDensity();

  // Threshold efetivo combinado: densidade compacta encurta, lista longa
  // (>4000px) ainda aplica o teto de 300 — o menor dos dois vence.
  const densityAdjusted =
    density === 'compact' ? Math.max(120, Math.round(threshold * compactRatio)) : threshold;

  useEffect(() => {
    const compute = () => {
      const docHeight = document.documentElement.scrollHeight;
      const longListCap = docHeight > 4000 ? 300 : densityAdjusted;
      const effective = Math.min(densityAdjusted, longListCap);
      setVisible(window.scrollY > effective);
      rafRef.current = null;
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(compute);
    };

    const handleOverlayOpen = () => setOverlayOpen(true);
    const handleOverlayClose = () => setOverlayOpen(false);

    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent<InfiniteScrollProgress>).detail;
      if (!detail) return;
      setProgress(detail);
    };
    const handleClear = (e: Event) => {
      const detail = (e as CustomEvent<{ scope: string }>).detail;
      setProgress((prev) => (prev && prev.scope === detail?.scope ? null : prev));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mobile-overlay-open', handleOverlayOpen);
    window.addEventListener('mobile-overlay-close', handleOverlayClose);
    window.addEventListener(INFINITE_SCROLL_PROGRESS_EVENT, handleProgress);
    window.addEventListener(INFINITE_SCROLL_CLEAR_EVENT, handleClear);
    compute();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mobile-overlay-open', handleOverlayOpen);
      window.removeEventListener('mobile-overlay-close', handleOverlayClose);
      window.removeEventListener(INFINITE_SCROLL_PROGRESS_EVENT, handleProgress);
      window.removeEventListener(INFINITE_SCROLL_CLEAR_EVENT, handleClear);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [densityAdjusted]);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tooFar = window.scrollY > 5000;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion || tooFar ? 'auto' : 'smooth',
    });
  };

  const shouldShow = visible && !overlayOpen;

  // Tooltip enriquecido quando há progresso de infinite scroll publicado.
  // Fallback para "Voltar ao topo" simples quando nenhuma lista publicou.
  const itemLabel = progress?.itemLabel ?? 'itens';

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn('z-40', className ?? 'fixed bottom-24 md:bottom-8 right-4 md:right-8')}
        >
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={scrollToTop}
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full shadow-sm bg-background/90 backdrop-blur-sm border-border/80 hover:bg-primary hover:text-primary-foreground transition-all"
                  aria-label="Voltar ao topo"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {progress ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Voltar ao topo</span>
                    <span className="text-muted-foreground tabular-nums">
                      {progress.hasMore ? (
                        <>
                          {progress.totalLoaded} de {progress.total} {itemLabel} carregados
                        </>
                      ) : (
                        <>
                          {progress.total} {itemLabel} carregados
                        </>
                      )}
                    </span>
                  </div>
                ) : (
                  'Voltar ao topo'
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
