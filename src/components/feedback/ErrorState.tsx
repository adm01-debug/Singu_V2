import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ErrorType = 'generic' | 'network' | 'server' | 'notFound' | 'timeout';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const errorConfigs: Record<ErrorType, { icon: typeof AlertCircle; defaultTitle: string; defaultDescription: string }> = {
  generic: {
    icon: AlertCircle,
    defaultTitle: 'Algo deu errado',
    defaultDescription: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  },
  network: {
    icon: WifiOff,
    defaultTitle: 'Sem conexão',
    defaultDescription: 'Verifique sua conexão com a internet e tente novamente.',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: 'Erro no servidor',
    defaultDescription: 'Nossos servidores estão temporariamente indisponíveis. Tente novamente em alguns minutos.',
  },
  notFound: {
    icon: FileQuestion,
    defaultTitle: 'Não encontrado',
    defaultDescription: 'O recurso que você está procurando não existe ou foi movido.',
  },
  timeout: {
    icon: RefreshCw,
    defaultTitle: 'Tempo esgotado',
    defaultDescription: 'A operação demorou muito. Verifique sua conexão e tente novamente.',
  },
};

export function ErrorState({
  type = 'generic',
  title,
  description,
  onRetry,
  retryLabel = 'Tentar novamente',
  isRetrying = false,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const config = errorConfigs[type];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1 
        }}
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mb-6',
          type === 'network' && 'bg-warning/10',
          type === 'server' && 'bg-destructive/10',
          type === 'notFound' && 'bg-muted',
          type === 'timeout' && 'bg-info/10',
          type === 'generic' && 'bg-destructive/10'
        )}
      >
        <Icon 
          className={cn(
            'w-10 h-10',
            type === 'network' && 'text-warning',
            type === 'server' && 'text-destructive',
            type === 'notFound' && 'text-muted-foreground',
            type === 'timeout' && 'text-info',
            type === 'generic' && 'text-destructive'
          )} 
          aria-hidden="true"
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        {title || config.defaultTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-md mb-6"
      >
        {description || config.defaultDescription}
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        {onRetry && (
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw 
              className={cn('w-4 h-4', isRetrying && 'animate-spin')} 
              aria-hidden="true" 
            />
            {isRetrying ? 'Tentando...' : retryLabel}
          </Button>
        )}
        {secondaryAction && (
          <Button 
            variant="outline" 
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
      </motion.div>

      {/* Helper text */}
      {type === 'network' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground mt-6 max-w-sm"
        >
          💡 Dica: Suas alterações serão salvas automaticamente quando a conexão for restaurada.
        </motion.p>
      )}
    </motion.div>
  );
}

// Quick error state for inline use
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20',
        className
      )}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" aria-hidden="true" />
      <span className="text-sm text-destructive flex-1">{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="gap-1.5 h-7 px-2">
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-xs">Tentar</span>
        </Button>
      )}
    </div>
  );
}

// Loading with error fallback wrapper
export function LoadingWithError({
  isLoading,
  isError,
  error,
  onRetry,
  children,
  loadingComponent,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}) {
  if (isLoading) {
    return <>{loadingComponent}</>;
  }
  
  if (isError) {
    const errorType: ErrorType = 
      error?.message?.includes('network') || error?.message?.includes('fetch') ? 'network' :
      error?.message?.includes('500') || error?.message?.includes('server') ? 'server' :
      error?.message?.includes('404') ? 'notFound' :
      error?.message?.includes('timeout') ? 'timeout' :
      'generic';
    
    return (
      <ErrorState
        type={errorType}
        description={error?.message}
        onRetry={onRetry}
      />
    );
  }
  
  return <>{children}</>;
}
