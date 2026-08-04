import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  digitClassName?: string;
}

// Flip-style counter like airport departure boards
export function FlipCounter({ value, className, digitClassName }: AnimatedCounterProps) {
  const digits = String(Math.abs(value)).padStart(1, '0').split('');
  const isNegative = value < 0;

  return (
    <div className={cn('flex items-center font-mono', className)}>
      {isNegative && (
        <span className={cn('mr-0.5', digitClassName)}>-</span>
      )}
      {digits.map((digit, index) => (
        <FlipDigit 
          key={`${index}-${digits.length}`} 
          digit={digit} 
          className={digitClassName}
        />
      ))}
    </div>
  );
}

interface FlipDigitProps {
  digit: string;
  className?: string;
}

function FlipDigit({ digit, className }: FlipDigitProps) {
  const [prevDigit, setPrevDigit] = useState(digit);
  
  useEffect(() => {
    if (digit !== prevDigit) {
      const timeout = setTimeout(() => {
        setPrevDigit(digit);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [digit, prevDigit]);

  return (
    <div className={cn(
      'relative overflow-hidden bg-card rounded px-1.5 py-0.5',
      'border border-border shadow-sm',
      className
    )}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="block text-foreground font-semibold"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Slot machine style counter
interface SlotCounterProps extends AnimatedCounterProps {
  minDigits?: number;
}

export function SlotCounter({ value, className, digitClassName, minDigits = 1 }: SlotCounterProps) {
  const digits = String(Math.abs(value)).padStart(minDigits, '0').split('');
  const isNegative = value < 0;

  return (
    <div className={cn('flex items-center', className)}>
      {isNegative && (
        <span className={cn('mr-0.5', digitClassName)}>-</span>
      )}
      {digits.map((digit, index) => (
        <SlotDigit 
          key={`${index}-${digits.length}`} 
          digit={digit}
          className={digitClassName}
        />
      ))}
    </div>
  );
}

interface SlotDigitProps {
  digit: string;
  className?: string;
}

function SlotDigit({ digit, className }: SlotDigitProps) {
  return (
    <div className={cn(
      'relative h-8 w-6 overflow-hidden',
      className
    )}>
      <motion.div
        className="absolute"
        animate={{ y: -parseInt(digit) * 32 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div 
            key={n} 
            className="h-8 w-6 flex items-center justify-center font-semibold text-foreground"
          >
            {n}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Count up/down with easing
interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
  formatter?: (value: number) => string;
  onComplete?: () => void;
}

export function CountUp({
  from = 0,
  to,
  duration = 1,
  delay = 0,
  className,
  formatter = (v) => Math.round(v).toLocaleString('pt-BR'),
  onComplete,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Ease out cubic
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = from + (to - from) * easeOutCubic;
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);
    
    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [from, to, duration, delay, onComplete]);

  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {formatter(displayValue)}
    </motion.span>
  );
}

// Badge with animated count
interface AnimatedBadgeProps {
  count: number;
  className?: string;
  maxCount?: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function AnimatedBadge({ 
  count, 
  className, 
  maxCount = 99,
  variant = 'default',
}: AnimatedBadgeProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={cn(
            'min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center',
            'text-xs font-semibold',
            variantClasses[variant],
            className
          )}
        >
          <motion.span
            key={displayCount}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {displayCount}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FlipCounter;
