import { useEffect, useRef } from 'react';

/**
 * Detects "rage clicks" (multiple clicks in a short period on the same area)
 * which usually indicate user frustration or unresponsive UI.
 */
export function useRageClickDetector() {
  const clickHistory = useRef<{ timestamp: number; x: number; y: number }[]>([]);
  const RAGE_THRESHOLD = 5; // clicks
  const TIME_WINDOW = 1000; // ms
  const DISTANCE_THRESHOLD = 50; // pixels

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      const newClick = { timestamp: now, x: e.clientX, y: e.clientY };
      
      // Filter old clicks
      clickHistory.current = clickHistory.current.filter(
        click => now - click.timestamp < TIME_WINDOW
      );
      
      clickHistory.current.push(newClick);

      if (clickHistory.current.length >= RAGE_THRESHOLD) {
        const firstClick = clickHistory.current[0];
        const isSameArea = clickHistory.current.every(
          click => 
            Math.abs(click.x - firstClick.x) < DISTANCE_THRESHOLD && 
            Math.abs(click.y - firstClick.y) < DISTANCE_THRESHOLD
        );

        if (isSameArea) {
          console.warn('[UX Audit] Detectado "Rage Click" em:', {
            x: e.clientX,
            y: e.clientY,
            target: e.target,
            path: window.location.pathname
          });
          // Reset history after detection
          clickHistory.current = [];
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
}