import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { direction } = useNavigationStack();
  const location = useLocation();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const slideOffset = direction === 'back' ? -16 : 16;
  const exitOffset = direction === 'back' ? 16 : -16;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: slideOffset, filter: 'blur(2px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: exitOffset, filter: 'blur(2px)' }}
        transition={{
          duration: 0.25,
          ease: [0.23, 1, 0.32, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
