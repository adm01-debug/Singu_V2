import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Trophy, Target, Heart, Sparkles, CheckCircle2, Star } from 'lucide-react';

type CelebrationType = 
  | 'follow-up-complete'
  | 'deal-closed'
  | 'relationship-milestone'
  | 'goal-achieved'
  | 'birthday-wished'
  | 'task-complete'
  | 'streak';

interface CelebrationConfig {
  type: CelebrationType;
  title: string;
  subtitle?: string;
  duration?: number;
}

interface CelebrationContextType {
  celebrate: (config: CelebrationConfig) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within CelebrationProvider');
  }
  return context;
};

const celebrationStyles: Record<CelebrationType, {
  icon: typeof PartyPopper;
  gradient: string;
  confettiColors: string[];
  emoji: string;
}> = {
  'follow-up-complete': {
    icon: CheckCircle2,
    gradient: 'from-success to-accent',
    confettiColors: ['#10B981', '#14B8A6', '#34D399', '#2DD4BF', '#6EE7B7'],
    emoji: '✅',
  },
  'deal-closed': {
    icon: Trophy,
    gradient: 'from-warning to-warning',
    confettiColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#D97706'],
    emoji: '🏆',
  },
  'relationship-milestone': {
    icon: Heart,
    gradient: 'from-primary to-primary',
    confettiColors: ['#F43F5E', '#EC4899', '#F472B6', '#FB7185', '#FDA4AF'],
    emoji: '💝',
  },
  'goal-achieved': {
    icon: Target,
    gradient: 'from-secondary to-secondary',
    confettiColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8'],
    emoji: '🎯',
  },
  'birthday-wished': {
    icon: PartyPopper,
    gradient: 'from-primary to-primary',
    confettiColors: ['#EC4899', '#F472B6', '#FBCFE8', '#DB2777', '#BE185D'],
    emoji: '🎂',
  },
  'task-complete': {
    icon: Sparkles,
    gradient: 'from-info to-accent',
    confettiColors: ['#3B82F6', '#06B6D4', '#22D3EE', '#60A5FA', '#0EA5E9'],
    emoji: '⭐',
  },
  'streak': {
    icon: Star,
    gradient: 'from-accent to-warning',
    confettiColors: ['#F97316', '#FB923C', '#FDBA74', '#EA580C', '#C2410C'],
    emoji: '🔥',
  },
};

interface ConfettiPieceProps {
  color: string;
  delay: number;
  startX: number;
}

const ConfettiPiece = ({ color, delay, startX }: ConfettiPieceProps) => {
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  const isCircle = Math.random() > 0.5;
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  const size = 8 + Math.random() * 8;
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  const rotation = Math.random() * 360;
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  const duration = 2 + Math.random() * 1.5;
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  const endX = startX + (Math.random() - 0.5) * 200;
  
  return (
    <motion.div
      initial={{ 
        y: -20, 
        x: startX,
        rotate: 0,
        opacity: 1,
        scale: 0,
      }}
      animate={{ 
        y: window.innerHeight + 50,
        x: endX,
        // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
        rotate: rotation + 720 * (Math.random() > 0.5 ? 1 : -1),
        opacity: [1, 1, 0],
        scale: [0, 1, 1, 0.5],
      }}
      transition={{ 
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: isCircle ? '50%' : '2px',
        boxShadow: `0 0 6px ${color}80`,
      }}
    />
  );
};

interface CelebrationOverlayProps {
  config: CelebrationConfig;
  onComplete: () => void;
}

const CelebrationOverlay = ({ config, onComplete }: CelebrationOverlayProps) => {
  const style = celebrationStyles[config.type];
  const Icon = style.icon;
  
  React.useEffect(() => {
    const timer = setTimeout(onComplete, config.duration || 3000);
    return () => clearTimeout(timer);
  }, [config.duration, onComplete]);
  
  const confettiPieces = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: style.confettiColors[i % style.confettiColors.length],
      // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
      delay: Math.random() * 0.3,
      // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
      startX: Math.random() * window.innerWidth,
    }));
  }, [style.confettiColors]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
    >
      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          color={piece.color}
          delay={piece.delay}
          startX={piece.startX}
        />
      ))}
      
      {/* Celebration Badge */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [180, 0, 0],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: 0.6,
            type: 'spring',
            bounce: 0.5,
          }}
          className="relative"
        >
          {/* Glow effect */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute inset-0 bg-gradient-to-r ${style.gradient} rounded-3xl blur-xl`}
          />
          
          <div className={`relative bg-gradient-to-br ${style.gradient} rounded-3xl p-6 shadow-md`}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Icon className="w-16 h-16 text-primary-foreground drop-shadow-sm" />
            </motion.div>
          </div>
          
          {/* Floating emoji */}
          <motion.span
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1.5, 1],
              y: [-20, -40, -30],
            }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute -top-4 -right-4 text-3xl"
          >
            {style.emoji}
          </motion.span>
        </motion.div>
      </div>
      
      {/* Text */}
      <div className="absolute inset-x-0 bottom-1/3 flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold text-foreground text-center px-4"
        >
          {config.title}
        </motion.h2>
        {config.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground text-lg mt-2 text-center px-4"
          >
            {config.subtitle}
          </motion.p>
        )}
      </div>
      
      {/* Sparkle particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ 
            opacity: 0,
            scale: 0,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: window.innerWidth / 2 + Math.cos(i * 30 * Math.PI / 180) * 150,
            y: window.innerHeight / 2 + Math.sin(i * 30 * Math.PI / 180) * 150,
          }}
          transition={{
            duration: 1,
            delay: 0.2 + i * 0.05,
            ease: 'easeOut',
          }}
          className="absolute w-3 h-3"
        >
          <Sparkles className="w-full h-full text-warning" />
        </motion.div>
      ))}
    </motion.div>
  );
};

interface CelebrationProviderProps {
  children: ReactNode;
}

export const CelebrationProvider = ({ children }: CelebrationProviderProps) => {
  const [activeCelebration, setActiveCelebration] = useState<CelebrationConfig | null>(null);
  
  const celebrate = useCallback((config: CelebrationConfig) => {
    setActiveCelebration(config);
  }, []);
  
  const handleComplete = useCallback(() => {
    setActiveCelebration(null);
  }, []);
  
  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      {activeCelebration && (
        <CelebrationOverlay
          config={activeCelebration}
          onComplete={handleComplete}
        />
      )}
    </CelebrationContext.Provider>
  );
};

export default CelebrationProvider;
