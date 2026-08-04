import { ReactNode } from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircuitOpenError } from '@/lib/circuitBreaker';

interface ExternalDataCardProps {
  /** Title shown in error/loading states */
  title: string;
  /** Icon element for the card header */
  icon?: ReactNode;
  /** React Query isLoading */
  isLoading?: boolean;
  /** React Query error */
  error?: Error | null;
  /** Whether data exists (falsy = empty state) */
  hasData?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Retry callback (from React Query refetch) */
  onRetry?: () => void;
  /** Content to render when data is available */
  children: ReactNode;
  /** Custom skeleton height class */
  skeletonHeight?: string;
}

/**
 * Wrapper for external intelligence cards.
 * Provides consistent loading, error, circuit-breaker, and empty states.
 */
export function ExternalDataCard({
  title,
  icon,
  isLoading,
  error,
  hasData = true,
  emptyMessage = 'Dados insuficientes para análise',
  onRetry,
  children,
  skeletonHeight = 'h-28',
}: ExternalDataCardProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`${skeletonHeight} bg-muted rounded`} />
        </CardContent>
      </Card>
    );
  }

  // Circuit breaker open — external DB temporarily unavailable
  if (error instanceof CircuitOpenError) {
    return (
      <Card className="border-warning/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <WifiOff className="h-6 w-6 text-warning" />
            <p className="text-xs text-muted-foreground">
              Base de dados temporariamente indisponível
            </p>
            <p className="text-[10px] text-muted-foreground">
              Reconectando automaticamente...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generic error
  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-xs text-muted-foreground">Erro ao carregar dados</p>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 text-xs gap-1">
                <RefreshCw className="h-3 w-3" /> Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Data available — render children
  return <>{children}</>;
}
