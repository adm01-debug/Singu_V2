import * as React from 'react';
import { cn } from '@/lib/utils';

/* ============================================
   SINGU Typography Component System
   Enforces consistent typography using design tokens
   ============================================ */

type TypographyVariant = 
  | 'display' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'lead' 
  | 'body' 
  | 'small' 
  | 'caption' 
  | 'eyebrow';

interface TypographyProps {
  variant?: TypographyVariant;
  as?: React.ElementType;
  gradient?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantMap: Record<TypographyVariant, { className: string; defaultTag: React.ElementType }> = {
  display: { className: 'text-display', defaultTag: 'h1' },
  h1: { className: 'text-h1', defaultTag: 'h1' },
  h2: { className: 'text-h2', defaultTag: 'h2' },
  h3: { className: 'text-h3', defaultTag: 'h3' },
  h4: { className: 'text-h4', defaultTag: 'h4' },
  lead: { className: 'text-lead', defaultTag: 'p' },
  body: { className: 'text-body', defaultTag: 'p' },
  small: { className: 'text-small', defaultTag: 'p' },
  caption: { className: 'text-caption', defaultTag: 'span' },
  eyebrow: { className: 'text-eyebrow', defaultTag: 'span' },
};

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ variant = 'body', as, gradient = false, className, children, ...props }, ref) => {
    const { className: variantClass, defaultTag } = variantMap[variant];
    const Component = as || defaultTag;

    return (
      <Component
        ref={ref}
        className={cn(
          gradient ? 'text-gradient-heading' : variantClass,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';

/* Convenience exports */
export const Heading = React.forwardRef<HTMLElement, Omit<TypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 }>(
  ({ level = 1, ...props }, ref) => (
    <Typography ref={ref} variant={`h${level}` as TypographyVariant} {...props} />
  )
);

Heading.displayName = 'Heading';

export const DisplayText = React.forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="display" {...props} />
);

DisplayText.displayName = 'DisplayText';
