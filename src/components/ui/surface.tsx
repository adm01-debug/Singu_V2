import * as React from 'react';
import { cn } from '@/lib/utils';

/* ============================================
   SINGU Surface Component
   Consistent elevation using design system surface tokens
   ============================================ */

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 0 | 1 | 2 | 3 | 4;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  bordered?: boolean;
  hoverable?: boolean;
  as?: React.ElementType;
}

const roundedMap = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
} as const;

const levelMap = {
  0: 'bg-surface-0',
  1: 'bg-surface-1',
  2: 'bg-surface-2',
  3: 'bg-surface-3',
  4: 'bg-surface-4',
} as const;

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ level = 1, rounded = 'lg', bordered = false, hoverable = false, as: Component = 'div', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          levelMap[level],
          roundedMap[rounded],
          bordered && 'border border-border',
          hoverable && 'card-hover cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Surface.displayName = 'Surface';
