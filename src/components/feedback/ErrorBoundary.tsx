import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/ux-messages';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    logger.critical('ErrorBoundary: render error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Force page reload after max retries
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const empathicMessage = getErrorMessage('generic');
      const canRetry = retryCount < this.maxRetries;
      const retryCountSuffix = retryCount > 0 ? ` (${retryCount}/${this.maxRetries})` : '';

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full border-destructive/20 bg-destructive/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-foreground">
                Ops! Algo deu errado
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {empathicMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showDetails && error && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm font-mono text-muted-foreground overflow-auto max-h-32">
                  <p className="font-semibold text-destructive">{error.name}: {error.message}</p>
                  {errorInfo?.componentStack && (
                    <pre className="text-xs mt-2 whitespace-pre-wrap">
                      {errorInfo.componentStack.slice(0, 500)}
                    </pre>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant={canRetry ? "default" : "secondary"}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {canRetry
                    ? `Tentar novamente${retryCountSuffix}`
                    : 'Recarregar página'
                  }
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para o início
                </Button>
              </div>
              
              {retryCount > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  {canRetry 
                    ? `Tentativa ${retryCount} de ${this.maxRetries}`
                    : 'Tentativas esgotadas. Uma recarga completa pode resolver.'
                  }
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Wrapper component for easier use with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

export function WithErrorBoundary({ children, fallback, showDetails }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback} showDetails={showDetails}>
      {children}
    </ErrorBoundary>
  );
}
