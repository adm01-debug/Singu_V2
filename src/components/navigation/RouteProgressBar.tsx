import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Honest progress bar that reflects real loading state:
 * - Triggers on route change
 * - Stays active while React Query is fetching data
 * - Completes when all queries resolve
 * - Falls back to a quick flash for instant transitions
 */
export function RouteProgressBar() {
  const location = useLocation();
  const isFetching = useIsFetching();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start progress on route change
  useEffect(() => {
    if (location.pathname === prevPathRef.current) return;
    prevPathRef.current = location.pathname;

    setVisible(true);
    setProgress(20); // Instant jump to 20% on route change

    // Clean up any existing timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
  }, [location.pathname]);

  // Progress based on fetching state
  useEffect(() => {
    if (!visible) return;

    if (isFetching > 0) {
      // Data is loading — slow asymptotic progress to 85%
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          const next = prev + (85 - prev) * 0.08;
          return Math.min(next, 85);
        });
      }, 80);
    } else {
      // All fetches complete — finish the bar
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      completeTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFetching, visible]);

  // Auto-complete if no fetches happen within 400ms of route change
  useEffect(() => {
    if (visible && isFetching === 0) {
      const timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible, isFetching]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 rounded-r-full shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
