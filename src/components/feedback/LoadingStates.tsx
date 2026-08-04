import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Spinner variants
export function Spinner({ 
  size = 'md', 
  className 
}: { 
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
}) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2 className={cn(sizes[size], "animate-spin text-primary", className)} />
  );
}

// Dots loading animation
export function DotsLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// Pulse loader
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-12 h-12", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={{ scale: [0.8, 1.5], opacity: [0.8, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.4,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-primary rounded-full" />
      </div>
    </div>
  );
}

// Circular progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 48, 
  strokeWidth = 4,
  className,
  showValue = false,
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-primary"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

// Full page loader
interface FullPageLoaderProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export function FullPageLoader({ 
  message = 'Carregando...', 
  showProgress = false,
  progress = 0,
}: FullPageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-10 h-10 text-primary" />
        </motion.div>
        <p className="text-muted-foreground">{message}</p>
        {showProgress && (
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Inline loader with text
interface InlineLoaderProps {
  message?: string;
  variant?: 'spinner' | 'dots' | 'sparkle';
  className?: string;
}

export function InlineLoader({ 
  message = 'Carregando',
  variant = 'spinner',
  className,
}: InlineLoaderProps) {
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'sparkle':
        return (
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
        );
      default:
        return <Spinner size="sm" />;
    }
  };

  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      {renderLoader()}
      <span className="text-sm">{message}</span>
    </div>
  );
}

// Skeleton shimmer effect
export function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted rounded-md", className)}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.1), transparent)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Button loading state
export function ButtonLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return <Loader2 className={cn(sizes[size], "animate-spin")} />;
}

// AI Processing loader
export function AIProcessingLoader({ message = 'Processando com IA...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <motion.div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-r from-primary via-secondary to-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary" />
        </div>
      </motion.div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <DotsLoader />
    </div>
  );
}

// Data fetching state
interface DataLoadingStateProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  loadingMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DataLoadingState({
  status,
  loadingMessage = 'Carregando dados...',
  errorMessage = 'Erro ao carregar dados',
  onRetry,
  children,
}: DataLoadingStateProps) {
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineLoader message={loadingMessage} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

export default {
  Spinner,
  DotsLoader,
  PulseLoader,
  CircularProgress,
  FullPageLoader,
  InlineLoader,
  ShimmerBlock,
  ButtonLoader,
  AIProcessingLoader,
  DataLoadingState,
};
