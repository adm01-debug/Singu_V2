import { useState, useEffect, useRef } from 'react';

interface LazyOptions {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading dashboard sections with IntersectionObserver.
 * Pre-loads content before it enters viewport via rootMargin.
 */
export function useLazySection(options: LazyOptions = {}) {
  const { rootMargin = '200px', threshold = 0, triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, triggerOnce]);

  return { ref, isVisible };
}
