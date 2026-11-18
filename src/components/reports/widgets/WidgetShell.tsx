import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { parseApiError } from '@/lib/errorMessages';

interface WidgetShellProps {
  title: string;
  icon: React.ElementType;
  isLoading?: boolean;
  error?: unknown;
  vazio?: boolean;
  textoVazio?: string;
  children: ReactNode;
}

/**
 * Moldura comum dos widgets do Report Builder: carregando, erro e vazio
 * tratados num lugar so, para nenhum widget cair no "vazio" quando o que
 * houve foi falha de consulta.
 */
export function WidgetShell({ title, icon: Icon, isLoading, error, vazio, textoVazio, children }: WidgetShellProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[96px]">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-xs">{parseApiError(error)}</span>
          </div>
        ) : vazio ? (
          <p className="text-xs text-muted-foreground">{textoVazio ?? 'Sem dados no período.'}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function NumeroGrande({ valor, legenda }: { valor: string | number; legenda: string }) {
  return (
    <div>
      <p className="text-3xl font-bold tabular-nums">{valor}</p>
      <p className="text-xs text-muted-foreground mt-1">{legenda}</p>
    </div>
  );
}
