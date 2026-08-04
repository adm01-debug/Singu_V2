import { useState, useEffect } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Respects the prefers-reduced-motion media query
 * @returns boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check initial value on client
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Handler for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns motion-safe animation values
 * If user prefers reduced motion, returns instant/no animation values
 */
export function useMotionSafe() {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,
    // Framer Motion compatible transition
    transition: prefersReducedMotion 
      ? { duration: 0 } 
      : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    // Quick transition for micro-interactions
    quickTransition: prefersReducedMotion 
      ? { duration: 0 } 
      : { duration: 0.15, ease: 'easeOut' },
    // Slow transition for page transitions
    slowTransition: prefersReducedMotion 
      ? { duration: 0 } 
      : { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    // Spring transition
    springTransition: prefersReducedMotion 
      ? { duration: 0 } 
      : { type: 'spring', stiffness: 300, damping: 30 },
    // CSS transition duration class
    durationClass: prefersReducedMotion ? 'duration-0' : 'duration-200',
  };
}

/**
 * Get animation variants that respect reduced motion preferences
 */
export function getMotionSafeVariants(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
    };
  }

  return {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    bounce: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { 
        opacity: 1, 
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      },
      exit: { opacity: 0, scale: 0.3 },
    },
  };
}

export default useReducedMotion;
