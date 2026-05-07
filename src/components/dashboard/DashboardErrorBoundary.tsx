import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Lightweight error boundary for individual dashboard widgets.
 * Prevents one broken widget from crashing the entire dashboard.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`[Dashboard] Error in ${this.props.sectionName || 'widget'}:`, { error: error.message, stack: error.stack, componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-6 rounded-lg border border-destructive/20 bg-destructive/5 min-h-[120px]">
          <div className="text-center space-y-2">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {this.props.sectionName ? `Erro ao carregar: ${this.props.sectionName}` : 'Erro ao carregar widget'}
            </p>
            <Button variant="ghost" size="sm" onClick={this.handleRetry} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
