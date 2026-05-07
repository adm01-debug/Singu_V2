import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isProviderOrderError, PROVIDER_ORDER } from '@/lib/providerGuard';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  providerName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary especializado para capturar erros de hierarquia de providers.
 * Mostra mensagem amigável com diagnóstico quando um provider falha por
 * dependência de contexto ausente.
 */
export class ProviderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    const isOrderIssue = isProviderOrderError(error);

    logger.error(
      `[ProviderErrorBoundary] ${this.props.providerName} falhou:`,
      { error: error.message, stack: error.stack, isOrderIssue }
    );
  }

  handleReload = () => window.location.reload();
  handleHome = () => { window.location.href = '/'; };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, providerName } = this.props;

    if (!hasError) return children;

    const isOrderIssue = error ? isProviderOrderError(error) : false;
    const providerDef = PROVIDER_ORDER.find(p => p.name === providerName);
    const deps = providerDef?.requires || [];

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-lg w-full border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              {isOrderIssue
                ? <Layers className="w-8 h-8 text-destructive" />
                : <AlertTriangle className="w-8 h-8 text-destructive" />}
            </div>
            <CardTitle className="text-xl text-foreground">
              {isOrderIssue ? 'Erro de Hierarquia de Providers' : 'Erro de Inicialização'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              O provider <code className="font-mono text-sm bg-muted px-1 rounded">{providerName}</code> encontrou um erro ao inicializar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOrderIssue && deps.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">
                  Dependências necessárias:
                </p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {deps.map(d => <li key={d}>{d} deve estar acima de {providerName}</li>)}
                </ul>
              </div>
            )}

            {import.meta.env.DEV && error && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm font-mono text-muted-foreground overflow-auto max-h-32">
                <p className="font-semibold text-destructive">{error.name}: {error.message}</p>
                {errorInfo?.componentStack && (
                  <pre className="text-xs mt-2 whitespace-pre-wrap">
                    {errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={this.handleHome} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
