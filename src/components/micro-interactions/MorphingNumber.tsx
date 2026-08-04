import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MorphingNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  formatAsCurrency?: boolean;
  formatAsPercentage?: boolean;
}

export function MorphingNumber({
  value,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 0.8,
  formatAsCurrency = false,
  formatAsPercentage = false,
}: MorphingNumberProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });
  
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      let formatted: string;
      
      if (formatAsCurrency) {
        formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest);
      } else if (formatAsPercentage) {
        formatted = `${latest.toFixed(decimals)}%`;
      } else {
        formatted = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest);
      }
      
      setDisplayValue(formatted);
    });
    
    return () => unsubscribe();
  }, [springValue, decimals, formatAsCurrency, formatAsPercentage]);

  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}

// Compact number formatting (1K, 1M, etc)
interface CompactNumberProps extends Omit<MorphingNumberProps, 'formatAsCurrency' | 'formatAsPercentage'> {
  compact?: boolean;
}

export function CompactNumber({
  value,
  className,
  prefix = '',
  suffix = '',
  compact = true,
}: CompactNumberProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (compact) {
        if (latest >= 1000000) {
          setDisplayValue(`${(latest / 1000000).toFixed(1)}M`);
        } else if (latest >= 1000) {
          setDisplayValue(`${(latest / 1000).toFixed(1)}K`);
        } else {
          setDisplayValue(Math.round(latest).toString());
        }
      } else {
        setDisplayValue(Math.round(latest).toString());
      }
    });
    
    return () => unsubscribe();
  }, [springValue, compact]);

  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}

// Score indicator with color morphing
interface ScoreIndicatorProps {
  score: number;
  maxScore?: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreIndicator({
  score,
  maxScore = 100,
  showPercentage = true,
  size = 'md',
  className,
}: ScoreIndicatorProps) {
  const percentage = (score / maxScore) * 100;
  
  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-success';
    if (pct >= 60) return 'text-primary';
    if (pct >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const sizeClasses = {
    sm: 'text-lg font-medium',
    md: 'text-2xl font-semibold',
    lg: 'text-4xl font-bold',
  };

  return (
    <motion.div
      className={cn('flex items-baseline gap-1', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <MorphingNumber
        value={score}
        className={cn(sizeClasses[size], getColor(percentage))}
      />
      {showPercentage && (
        <span className="text-muted-foreground text-sm">
          / {maxScore}
        </span>
      )}
    </motion.div>
  );
}

export default MorphingNumber;
