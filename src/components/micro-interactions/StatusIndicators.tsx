import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PulsingDotProps {
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

/**
 * Animated pulsing dot indicator
 */
export function PulsingDot({ 
  color = 'primary', 
  size = 'md',
  className 
}: PulsingDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {/* Ping animation */}
      <motion.span
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75',
          colorClasses[color]
        )}
        animate={{
          scale: [1, 1.5, 1.5],
          opacity: [0.75, 0, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      {/* Static dot */}
      <span
        className={cn(
          'relative inline-flex rounded-full',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
    </span>
  );
}

interface StatusDotProps {
  status: 'online' | 'away' | 'busy' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPulse?: boolean;
}

const statusColors = {
  online: 'bg-success',
  away: 'bg-warning',
  busy: 'bg-destructive',
  offline: 'bg-muted-foreground',
};

/**
 * Status indicator dot (for presence, etc.)
 */
export function StatusDot({ 
  status, 
  size = 'md',
  className,
  showPulse = true,
}: StatusDotProps) {
  const shouldPulse = showPulse && status === 'online';

  return (
    <span className={cn('relative inline-flex', className)}>
      {shouldPulse && (
        <motion.span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full',
            statusColors[status],
            'opacity-50'
          )}
          animate={{
            scale: [1, 1.4],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full border-2 border-background',
          sizeClasses[size],
          statusColors[status]
        )}
      />
    </span>
  );
}

interface LiveIndicatorProps {
  className?: string;
  label?: string;
}

/**
 * "LIVE" badge indicator
 */
export function LiveIndicator({ className, label = 'AO VIVO' }: LiveIndicatorProps) {
  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive',
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <PulsingDot color="destructive" size="sm" />
      <span className="text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
    </motion.div>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

/**
 * Connection status indicator
 */
export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <motion.div
      className={cn('flex items-center gap-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <StatusDot 
        status={isConnected ? 'online' : 'offline'} 
        size="sm" 
        showPulse={isConnected}
      />
      <span className={cn(
        'text-xs font-medium',
        isConnected ? 'text-success' : 'text-muted-foreground'
      )}>
        {isConnected ? 'Conectado' : 'Desconectado'}
      </span>
    </motion.div>
  );
}

export default { PulsingDot, StatusDot, LiveIndicator, ConnectionStatus };
