import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  onAction: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeableListItem({
  children,
  onDelete,
  onArchive,
  threshold = 80,
  className,
  disabled = false,
}: SwipeableListItemProps) {
  const [, setIsRevealed] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  // Transform x position into action opacity
  const deleteOpacity = useTransform(x, [-threshold * 2, -threshold, 0], [1, 0.8, 0]);
  const archiveOpacity = useTransform(x, [0, threshold, threshold * 2], [0, 0.8, 1]);
  const deleteScale = useTransform(x, [-threshold * 2, -threshold, 0], [1.1, 1, 0.8]);
  const archiveScale = useTransform(x, [0, threshold, threshold * 2], [0.8, 1, 1.1]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeX = info.offset.x;
    
    if (swipeX < -threshold && onDelete) {
      onDelete();
      setIsRevealed(false);
    } else if (swipeX > threshold && onArchive) {
      onArchive();
      setIsRevealed(false);
    } else {
      setIsRevealed(false);
    }
  }, [threshold, onDelete, onArchive]);

  // Only enable on touch devices
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  
  if (disabled || !isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={constraintsRef} className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Delete action background (right swipe reveals) */}
      {onDelete && (
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center justify-end px-6 bg-destructive"
          style={{ opacity: deleteOpacity }}
        >
          <motion.div style={{ scale: deleteScale }} className="flex flex-col items-center gap-1">
            <Trash2 className="w-5 h-5 text-destructive-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-destructive-foreground">Excluir</span>
          </motion.div>
        </motion.div>
      )}
      
      {/* Archive action background (left swipe reveals) */}
      {onArchive && (
        <motion.div 
          className="absolute inset-y-0 left-0 flex items-center justify-start px-6 bg-primary"
          style={{ opacity: archiveOpacity }}
        >
          <motion.div style={{ scale: archiveScale }} className="flex flex-col items-center gap-1">
            <Archive className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-primary-foreground">Arquivar</span>
          </motion.div>
        </motion.div>
      )}
      
      {/* Main content - draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: onDelete ? -threshold * 2 : 0, right: onArchive ? threshold * 2 : 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-card touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
