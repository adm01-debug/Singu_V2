import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useFeatureDiscovery } from '@/hooks/useFeatureDiscovery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface FeatureSpotlightProps {
  featureId: string;
  title: string;
  description: string;
  /** Delay in ms before showing */
  delay?: number;
  /** Position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a UI element with a one-time feature discovery spotlight
 * Only shown once per user (tracked via localStorage)
 */
export function FeatureSpotlight({
  featureId,
  title,
  description,
  delay = 1500,
  position = 'bottom',
  children,
  className,
}: FeatureSpotlightProps) {
  const { hasSeenFeature, markAsSeen } = useFeatureDiscovery();
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasSeenFeature(featureId)) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [featureId, delay, hasSeenFeature]);

  const dismiss = () => {
    setVisible(false);
    markAsSeen(featureId);
  };

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-primary',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-primary',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-primary',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-primary',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className={cn(
              'absolute z-50 w-56',
              positionClasses[position]
            )}
          >
            {/* Arrow */}
            <div className={cn('absolute w-0 h-0 border-[6px]', arrowClasses[position])} />
            
            {/* Card */}
            <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-semibold">{title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0"
                  onClick={dismiss}
                  aria-label="Fechar"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-primary-foreground/80 mt-1 leading-relaxed">
                {description}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2 h-6 text-xs w-full"
                onClick={dismiss}
              >
                Entendi!
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
