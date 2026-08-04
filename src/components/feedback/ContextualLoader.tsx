import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, BarChart3, Users, Building2, MessageSquare, Calendar, Network } from 'lucide-react';
import { getLoadingMessage } from '@/lib/ux-messages';
import { cn } from '@/lib/utils';

type LoaderContext = 'dashboard' | 'contacts' | 'companies' | 'interactions' | 'analytics' | 'calendar' | 'network' | 'general';

interface ContextualLoaderProps {
  context?: LoaderContext;
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
  className?: string;
  inline?: boolean;
}

const contextIcons: Record<LoaderContext, typeof Loader2> = {
  dashboard: Sparkles,
  contacts: Users,
  companies: Building2,
  interactions: MessageSquare,
  analytics: BarChart3,
  calendar: Calendar,
  network: Network,
  general: Loader2,
};

const contextColors: Record<LoaderContext, string> = {
  dashboard: 'text-primary',
  contacts: 'text-primary',
  companies: 'text-secondary',
  interactions: 'text-success',
  analytics: 'text-info',
  calendar: 'text-accent',
  network: 'text-accent',
  general: 'text-muted-foreground',
};

const sizeClasses = {
  sm: { icon: 'w-4 h-4', container: 'p-2', text: 'text-xs' },
  md: { icon: 'w-6 h-6', container: 'p-4', text: 'text-sm' },
  lg: { icon: 'w-10 h-10', container: 'p-6', text: 'text-base' },
};

export function ContextualLoader({ 
  context = 'general', 
  size = 'md', 
  showMessage = true,
  className,
  inline = false,
}: ContextualLoaderProps) {
  const [message, setMessage] = useState(() => getLoadingMessage(context));
  const Icon = contextIcons[context];
  const color = contextColors[context];
  const sizes = sizeClasses[size];

  // Rotate messages every few seconds
  useEffect(() => {
    if (!showMessage) return;
    
    const interval = setInterval(() => {
      setMessage(getLoadingMessage(context));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [context, showMessage]);

  if (inline) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <Loader2 className={cn('animate-spin', sizes.icon, color)} />
        {showMessage && (
          <span className={cn(sizes.text, 'text-muted-foreground')}>
            {message}
          </span>
        )}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        sizes.container,
        className
      )}
    >
      <div className="relative">
        {/* Outer glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={cn(
            'absolute inset-0 rounded-full blur-xl',
            context === 'dashboard' && 'bg-primary/20',
            context === 'contacts' && 'bg-primary/20',
            context === 'companies' && 'bg-secondary/20',
            context === 'interactions' && 'bg-success/20',
            context === 'analytics' && 'bg-info/20',
            context === 'calendar' && 'bg-accent/20',
            context === 'network' && 'bg-accent/20',
            context === 'general' && 'bg-muted-foreground/20',
          )}
        />
        
        {/* Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="relative"
        >
          <Icon className={cn(sizes.icon, color)} />
        </motion.div>
      </div>

      {showMessage && (
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className={cn(sizes.text, 'text-muted-foreground text-center')}
          >
            {message}
          </motion.p>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

// Full page loader
export function PageLoader({ context = 'general' }: { context?: LoaderContext }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <ContextualLoader context={context} size="lg" />
    </div>
  );
}

// Overlay loader
interface OverlayLoaderProps {
  context?: LoaderContext;
  visible: boolean;
  message?: string;
}

export function OverlayLoader({ context = 'general', visible, message }: OverlayLoaderProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg"
        >
          <ContextualLoader context={context} size="md" />
          {message && (
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skeleton with shimmer effect
interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function SkeletonLoader({ 
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonLoaderProps) {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={cn(
        'skeleton-shimmer bg-muted',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}
