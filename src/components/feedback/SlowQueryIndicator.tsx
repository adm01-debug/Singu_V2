import { useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSlowQueryDetector } from '@/hooks/useSlowQueryDetector';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SlowQueryIndicator() {
  const { isSlowQuery, duration, severity } = useSlowQueryDetector();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const toastShown = useRef(false);

  // Show toast once per session
  useEffect(() => {
    if (isSlowQuery && !toastShown.current) {
      toastShown.current = true;
      toast.warning('Algumas operações estão mais lentas que o normal', {
        description: 'Isso pode ser temporário. Verifique sua conexão.',
        duration: 5000,
      });
    }
  }, [isSlowQuery]);

  if (!isSlowQuery) return null;

  const isWarning = severity === 'warning';
  const seconds = (duration / 1000).toFixed(1);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => isAdmin && navigate('/admin/telemetria')}
          className={cn(
            'fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-300 animate-fade-in',
            isWarning
              ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
              : 'bg-destructive/15 text-destructive border border-destructive/30',
            isAdmin && 'cursor-pointer hover:scale-105',
            !isAdmin && 'cursor-default',
          )}
          aria-label="Carregamento lento detectado"
        >
          <Timer className={cn('h-3.5 w-3.5 animate-pulse', isWarning ? 'text-yellow-500' : 'text-destructive')} />
          <span>{seconds}s</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs max-w-[200px]">
        <p className="font-medium">Carregamento lento detectado</p>
        <p className="text-muted-foreground">Duração: {seconds}s</p>
        {isAdmin && <p className="text-primary mt-1">Clique para ver telemetria</p>}
      </TooltipContent>
    </Tooltip>
  );
}
