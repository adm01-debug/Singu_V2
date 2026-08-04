import { useMemo } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface StaggerConfig {
  baseDelay?: number;
  maxDelay?: number;
  duration?: number;
}

/**
 * Hook to generate stagger animation props for lists/grids.
 * Respects reduced motion preferences.
 */
export function useStaggerAnimation(count: number, config: StaggerConfig = {}) {
  const { baseDelay = 0.03, maxDelay = 0.3, duration = 0.3 } = config;
  const prefersReducedMotion = useReducedMotion();

  return useMemo(() => {
    if (prefersReducedMotion) {
      return Array.from({ length: count }, () => ({
        initial: {},
        animate: {},
        transition: { duration: 0 },
        style: {},
      }));
    }

    const clampedDelay = Math.min(baseDelay, maxDelay / Math.max(count, 1));

    return Array.from({ length: count }, (_, index) => ({
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, delay: index * clampedDelay },
      style: { '--stagger-index': index } as React.CSSProperties,
    }));
  }, [count, baseDelay, maxDelay, duration, prefersReducedMotion]);
}
