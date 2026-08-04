import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  startValue?: number;
}

/**
 * Animated number ticker that counts up/down when in view
 */
export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  startValue,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const initialValue = startValue ?? (direction === 'down' ? value : 0);
  const targetValue = direction === 'down' ? 0 : value;

  const spring = useSpring(initialValue, {
    stiffness: 75,
    damping: 30,
  });

  const display = useTransform(spring, (current) =>
    Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(current)
  );

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(targetValue);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasAnimated, delay, spring, targetValue]);

  // Update when value changes
  useEffect(() => {
    if (hasAnimated) {
      spring.set(value);
    }
  }, [value, hasAnimated, spring]);

  return (
    <motion.span
      ref={ref}
      className={cn('tabular-nums tracking-tight', className)}
    >
      {display}
    </motion.span>
  );
}

export default NumberTicker;
