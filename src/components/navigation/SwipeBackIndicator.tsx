import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAuth } from '@/hooks/useAuth';

const HINT_STORAGE_KEY_PREFIX = 'singu_swipe_hint_shown';

/**
 * Unified swipe-back gesture handler + visual indicator for mobile.
 * - Edge detection zone: 45px (wider for curved-edge devices)
 * - Dead zone: ignores first 10px to distinguish scroll from swipe
 * - Visual gradient bar feedback during gesture
 * - Gesture affordance hint on first visit
 * - Threshold: 80px horizontal to trigger navigation
 */
export function SwipeBackIndicator() {
  const { user } = useAuth();
  const hintKey = `${HINT_STORAGE_KEY_PREFIX}-${user?.id ?? 'anon'}`;
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const location = useLocation();
  const { goBack } = useNavigationStack();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isEdgeRef = useRef(false);
  const directionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);

  const isRoot = location.pathname === '/';
  const EDGE_WIDTH = 45;
  const DEAD_ZONE = 10;
  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= EDGE_WIDTH && !isRoot) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      isEdgeRef.current = true;
      directionLockedRef.current = null;
    }
  }, [isRoot]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isEdgeRef.current || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (!directionLockedRef.current) {
      if (deltaX > DEAD_ZONE || deltaY > DEAD_ZONE) {
        directionLockedRef.current = deltaX > deltaY ? 'horizontal' : 'vertical';
        if (directionLockedRef.current === 'vertical') {
          isEdgeRef.current = false;
          setIsActive(false);
          setSwipeProgress(0);
          return;
        }
        setIsActive(true);
      }
      return;
    }

    if (directionLockedRef.current === 'horizontal' && deltaX > 0) {
      const progress = Math.min(deltaX / 120, 1);
      setSwipeProgress(progress);
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isEdgeRef.current || !touchStartRef.current) {
      setIsActive(false);
      setSwipeProgress(0);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (directionLockedRef.current === 'horizontal' && deltaX > THRESHOLD && deltaX > deltaY * 1.5) {
      goBack('/');
    }

    touchStartRef.current = null;
    isEdgeRef.current = false;
    directionLockedRef.current = null;
    setIsActive(false);
    setSwipeProgress(0);
  }, [goBack]);

  // Touch event listeners
  useEffect(() => {
    if (isRoot) return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRoot, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Gesture affordance hint — shown once on first non-root page visit
  useEffect(() => {
    if (isRoot) return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    try {
      const shown = localStorage.getItem(hintKey);
      if (!shown) {
        const timer = setTimeout(() => {
          setShowHint(true);
          try { localStorage.setItem(hintKey, '1'); } catch { /* quota/private */ }
          setTimeout(() => setShowHint(false), 2500);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignora falhas de acesso ao storage (ex.: modo privado)
    }
  }, [isRoot]);

  if (isRoot) return null;

  return (
    <>
      {/* Gesture hint — shown once on first detail page visit */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.4 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none md:hidden"
          >
            <motion.div
              animate={{ x: [0, 12, 0] }}
              transition={{ duration: 1.2, repeat: 1, ease: 'easeInOut' }}
              className="w-1.5 h-16 bg-primary/40 rounded-r-full shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active swipe progress indicator */}
      <AnimatePresence>
        {isActive && swipeProgress > 0.05 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeProgress }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-y-0 left-0 z-50 pointer-events-none md:hidden"
            style={{ width: `${Math.max(4, swipeProgress * 40)}px` }}
          >
            <div
              className="h-full bg-gradient-to-r from-primary/30 to-transparent rounded-r-full"
              style={{ opacity: swipeProgress }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
