import { Sparkles, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LuxButtonProps {
  onClick: () => void;
  loading?: boolean;
  processing?: boolean;
  variant?: 'header' | 'default' | 'compact';
  className?: string;
}

export function LuxButton({ onClick, loading, processing, variant = 'default', className }: LuxButtonProps) {
  const isDisabled = loading || processing;

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={onClick}
          disabled={isDisabled}
          size="sm"
          className={cn(
            "relative overflow-hidden bg-gradient-premium",
            "hover:opacity-90",
            "text-primary-foreground border-0 shadow-sm",
            "transition-all duration-300",
            processing && "animate-pulse",
            className
          )}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={!isDisabled ? { x: '100%' } : {}}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          />
          {isDisabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </motion.div>
    );
  }

  if (variant === 'header') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onClick}
          disabled={isDisabled}
          className={cn(
            "relative overflow-hidden",
            "bg-gradient-premium bg-[length:200%_100%]",
            "hover:bg-[position:100%_0]",
            "text-primary-foreground border-0",
            "shadow-sm",
            "backdrop-blur-sm",
            "transition-all duration-500",
            "font-semibold tracking-wide",
            className
          )}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: '-100%' }}
            animate={!isDisabled ? { x: '100%' } : {}}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
          />
          
          <AnimatePresence mode="wait">
            {processing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
                <span>Analisando...</span>
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Iniciando...</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Lux Intelligence</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    );
  }

  // Default variant - large prominent button
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={onClick}
        disabled={isDisabled}
        size="lg"
        className={cn(
          "relative overflow-hidden w-full",
          "bg-gradient-premium bg-[length:200%_100%]",
          "hover:bg-[position:100%_0]",
          "text-primary-foreground border-0",
          "shadow-md",
          "transition-all duration-500",
          "font-semibold text-base tracking-wide",
          "py-6",
          className
        )}
      >
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={!isDisabled ? { x: '100%' } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        
        {/* Particle effects when idle */}
        {!isDisabled && (
          <>
            <motion.div
              className="absolute w-1 h-1 bg-foreground/40 rounded-full"
              animate={{
                x: [0, 30, 60],
                y: [0, -20, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              style={{ left: '20%', top: '50%' }}
            />
            <motion.div
              className="absolute w-1 h-1 bg-foreground/40 rounded-full"
              animate={{
                x: [0, -25, -50],
                y: [0, -15, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
              style={{ right: '20%', top: '50%' }}
            />
          </>
        )}

        <AnimatePresence mode="wait">
          {processing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-5 h-5" />
              </motion.div>
              <span>Varredura em andamento...</span>
              <motion.div
                className="flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-foreground rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Iniciando Lux...</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              <span>Ativar Lux Intelligence</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
