import { motion, Easing } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SuccessCheckmarkProps {
  show: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onComplete?: () => void;
}

const sizeConfig = {
  sm: { container: 'w-8 h-8', stroke: 2, viewBox: 24 },
  md: { container: 'w-12 h-12', stroke: 2.5, viewBox: 24 },
  lg: { container: 'w-16 h-16', stroke: 3, viewBox: 24 },
  xl: { container: 'w-24 h-24', stroke: 3.5, viewBox: 24 },
};

const easeOut: Easing = [0.0, 0.0, 0.2, 1];

export function SuccessCheckmark({ 
  show, 
  size = 'md',
  className,
  onComplete,
}: SuccessCheckmarkProps) {
  const config = sizeConfig[size];

  if (!show) return null;

  return (
    <motion.div
      className={cn('flex items-center justify-center', className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      onAnimationComplete={() => {
        setTimeout(() => onComplete?.(), 500);
      }}
    >
      <svg
        className={cn(config.container, 'text-success')}
        viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          fill="transparent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            transition: {
              pathLength: { duration: 0.4, ease: easeOut },
              opacity: { duration: 0.1 },
            }
          }}
        />
        
        {/* Checkmark */}
        <motion.path
          d="M7 12l3 3 7-7"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="transparent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            transition: {
              pathLength: { duration: 0.3, ease: easeOut, delay: 0.3 },
              opacity: { duration: 0.1, delay: 0.3 },
            }
          }}
        />
      </svg>
    </motion.div>
  );
}

// Error X mark animation
interface ErrorXMarkProps {
  show: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onComplete?: () => void;
}

export function ErrorXMark({ 
  show, 
  size = 'md',
  className,
  onComplete,
}: ErrorXMarkProps) {
  const config = sizeConfig[size];

  if (!show) return null;

  return (
    <motion.div
      className={cn('flex items-center justify-center', className)}
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      onAnimationComplete={() => {
        setTimeout(() => onComplete?.(), 500);
      }}
    >
      <svg
        className={cn(config.container, 'text-destructive')}
        viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          fill="transparent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            transition: {
              pathLength: { duration: 0.4, ease: easeOut },
              opacity: { duration: 0.1 },
            }
          }}
        />
        
        {/* X mark - first line */}
        <motion.path
          d="M8 8l8 8"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          fill="transparent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            transition: {
              pathLength: { duration: 0.2, ease: easeOut, delay: 0.3 },
              opacity: { duration: 0.1, delay: 0.3 },
            }
          }}
        />
        
        {/* X mark - second line */}
        <motion.path
          d="M16 8l-8 8"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          fill="transparent"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            transition: {
              pathLength: { duration: 0.2, ease: easeOut, delay: 0.4 },
              opacity: { duration: 0.1, delay: 0.4 },
            }
          }}
        />
      </svg>
    </motion.div>
  );
}

// Loading spinner with animated dots
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: (i: number) => ({
      y: [-4, 0, -4],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.1,
      },
    }),
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(dotSize[size], 'rounded-full bg-primary')}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          custom={i}
        />
      ))}
    </div>
  );
}

// Progress ring
interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 4,
  className,
  showValue = true,
}: ProgressRingProps) {
  const sizeMap = { sm: 40, md: 64, lg: 96 };
  const dimension = sizeMap[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={dimension}
        height={dimension}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default SuccessCheckmark;
