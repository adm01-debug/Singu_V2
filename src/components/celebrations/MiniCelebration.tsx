import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Star, Heart, Zap, Trophy, Flame, ThumbsUp, PartyPopper } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

type MiniCelebrationVariant = 
  | 'success' 
  | 'star' 
  | 'sparkle' 
  | 'heart' 
  | 'zap' 
  | 'trophy' 
  | 'flame' 
  | 'thumbsUp'
  | 'party';

interface MiniCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  variant?: MiniCelebrationVariant;
  position?: { x: number; y: number };
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<MiniCelebrationVariant, {
  icon: typeof Check;
  color: string;
  bgColor: string;
  particles: string[];
}> = {
  success: {
    icon: Check,
    color: 'text-success',
    bgColor: 'bg-success',
    particles: ['#10B981', '#34D399', '#6EE7B7'],
  },
  star: {
    icon: Star,
    color: 'text-warning',
    bgColor: 'bg-warning',
    particles: ['#F59E0B', '#FBBF24', '#FCD34D'],
  },
  sparkle: {
    icon: Sparkles,
    color: 'text-secondary',
    bgColor: 'bg-secondary',
    particles: ['#3B82F6', '#60A5FA', '#93C5FD'],
  },
  heart: {
    icon: Heart,
    color: 'text-primary',
    bgColor: 'bg-primary',
    particles: ['#F43F5E', '#FB7185', '#FDA4AF'],
  },
  zap: {
    icon: Zap,
    color: 'text-warning',
    bgColor: 'bg-warning',
    particles: ['#EAB308', '#FACC15', '#FDE047'],
  },
  trophy: {
    icon: Trophy,
    color: 'text-accent',
    bgColor: 'bg-accent',
    particles: ['#F97316', '#FB923C', '#FDBA74'],
  },
  flame: {
    icon: Flame,
    color: 'text-destructive',
    bgColor: 'bg-destructive',
    particles: ['#EF4444', '#F87171', '#FCA5A5'],
  },
  thumbsUp: {
    icon: ThumbsUp,
    color: 'text-info',
    bgColor: 'bg-info',
    particles: ['#3B82F6', '#60A5FA', '#93C5FD'],
  },
  party: {
    icon: PartyPopper,
    color: 'text-primary',
    bgColor: 'bg-primary',
    particles: ['#EC4899', '#F472B6', '#FBCFE8'],
  },
};

const sizeConfig = {
  sm: { icon: 'w-5 h-5', particle: 'w-1.5 h-1.5', distance: 25, container: 'text-xs' },
  md: { icon: 'w-8 h-8', particle: 'w-2 h-2', distance: 40, container: 'text-sm' },
  lg: { icon: 'w-12 h-12', particle: 'w-3 h-3', distance: 60, container: 'text-base' },
};

const MiniCelebration = ({ 
  show, 
  onComplete, 
  variant = 'success',
  position,
  message,
  size = 'md',
}: MiniCelebrationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; color: string }>>([]);
  const config = variants[variant];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;
  
  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: i * 45,
        color: config.particles[i % config.particles.length],
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, config.particles]);
  
  if (!position) return null;
  
  return (
    <AnimatePresence>
      {show && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: position.x, top: position.y }}
        >
          {/* Central icon burst */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.5, 1], rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2", config.color)}
          >
            <Icon className={sizeStyles.icon} />
          </motion.div>
          
          {/* Particle burst */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                scale: 0,
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                scale: [0, 1, 0.5],
                x: Math.cos(particle.angle * Math.PI / 180) * sizeStyles.distance,
                y: Math.sin(particle.angle * Math.PI / 180) * sizeStyles.distance,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className={cn("rounded-full", sizeStyles.particle)}
                style={{ backgroundColor: particle.color }}
              />
            </motion.div>
          ))}
          
          {/* Ring expansion */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2",
              config.color.replace('text-', 'border-')
            )}
          />

          {/* Optional message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 25 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
                "px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm",
                "border border-border shadow-sm font-medium",
                sizeStyles.container,
                config.color
              )}
            >
              {message}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

// Hook for easily triggering mini celebrations
// eslint-disable-next-line react-refresh/only-export-components
export const useMiniCelebration = () => {
  const [state, setState] = useState<{
    show: boolean;
    position: { x: number; y: number } | undefined;
    variant: MiniCelebrationVariant;
    message?: string;
  }>({
    show: false,
    position: undefined,
    variant: 'success',
    message: undefined,
  });

  const trigger = useCallback((
    event: React.MouseEvent | { clientX: number; clientY: number },
    options?: {
      variant?: MiniCelebrationVariant;
      message?: string;
    }
  ) => {
    setState({
      show: true,
      position: { x: event.clientX, y: event.clientY },
      variant: options?.variant || 'success',
      message: options?.message,
    });
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({ ...prev, show: false }));
  }, []);

  return {
    ...state,
    trigger,
    reset,
    MiniCelebrationComponent: (
      <MiniCelebration
        show={state.show}
        position={state.position}
        variant={state.variant}
        message={state.message}
        onComplete={reset}
      />
    ),
  };
};

// Quick action wrapper that adds celebration on click
interface CelebratoryButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: MiniCelebrationVariant;
  message?: string;
  className?: string;
  disabled?: boolean;
}

export const CelebratoryAction = ({
  children,
  onClick,
  variant = 'success',
  message,
  className,
  disabled,
}: CelebratoryButtonProps) => {
  const { show, position, trigger, reset, variant: celebrationVariant, message: celebrationMessage } = useMiniCelebration();

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    trigger(e, { variant, message });
    onClick?.(e);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e as unknown as React.MouseEvent<HTMLDivElement>); } }}
        className={cn("cursor-pointer", className, disabled && "opacity-50 cursor-not-allowed")}
        aria-disabled={disabled || undefined}
      >
        {children}
      </div>
      <MiniCelebration
        show={show}
        position={position}
        variant={celebrationVariant}
        message={celebrationMessage}
        onComplete={reset}
      />
    </>
  );
};

export default MiniCelebration;
