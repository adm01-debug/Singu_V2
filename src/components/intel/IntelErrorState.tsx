import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntelErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const IntelErrorState = ({
  message = 'Falha ao consultar fonte de dados.',
  onRetry,
}: IntelErrorStateProps) => {
  return (
    <div
      role="alert"
      className="intel-card p-6 flex flex-col items-center gap-3 text-center border-[hsl(var(--sev-critical)/0.4)]"
    >
      <AlertTriangle className="h-5 w-5 text-[hsl(var(--sev-critical,0_85%_60%))]" aria-hidden />
      <div>
        <div className="intel-eyebrow text-[10px]">QUERY_FAILED</div>
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="intel-mono text-[10px] uppercase h-8 gap-1.5"
        >
          <RefreshCw className="h-3 w-3" aria-hidden /> Retentar
        </Button>
      )}
    </div>
  );
};
