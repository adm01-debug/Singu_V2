import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
  threshold = 80,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const indicatorOpacity = useTransform(pullDistance, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorRotate = useTransform(pullDistance, [0, threshold], [0, 180]);
  const indicatorScale = useTransform(pullDistance, [0, threshold], [0.5, 1]);

  // Only enable on touch devices
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isTouchDevice) return;
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing, isTouchDevice]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !startY.current) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startY.current = 0;
      pullDistance.set(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, (currentY - startY.current) * 0.4); // Dampen
    pullDistance.set(Math.min(diff, threshold * 1.5));
  }, [disabled, isRefreshing, pullDistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance.get() >= threshold) {
      setIsRefreshing(true);
      pullDistance.set(threshold / 2);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    pullDistance.set(0);
    startY.current = 0;
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  if (!isTouchDevice || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ 
          height: pullDistance,
          opacity: indicatorOpacity,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : (
          <motion.div style={{ rotate: indicatorRotate, scale: indicatorScale }}>
            <ArrowDown className="w-6 h-6 text-primary" />
          </motion.div>
        )}
      </motion.div>

      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="overflow-auto"
      >
        <motion.div style={{ y: isRefreshing ? threshold / 2 : 0 }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
