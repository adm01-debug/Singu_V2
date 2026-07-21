/**
 * Sistema de Monitoramento de Erros em Produção
 * Captura, agrega e reporta erros para análise
 */
import { logger } from '@/lib/logger';

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
}

interface ErrorBatch {
  errors: ErrorReport[];
  sessionId: string;
  appVersion: string;
}

// Armazena erros em memória para batch reporting
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 segundos

// Session ID único para correlação
const sessionId = crypto.randomUUID();

// Fingerprint para agrupar erros similares
function generateFingerprint(error: Error): string {
  const stack = error.stack || '';
  const firstStackLine = stack.split('\n')[1] || '';
  return btoa(`${error.name}:${error.message}:${firstStackLine}`).slice(0, 32);
}

// Determina severidade baseada no tipo de erro
function determineSeverity(error: Error): ErrorReport['severity'] {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'medium';
  }
  if (message.includes('chunk') || message.includes('loading')) {
    return 'low';
  }
  if (message.includes('auth') || message.includes('permission')) {
    return 'high';
  }
  if (message.includes('undefined') || message.includes('null')) {
    return 'medium';
  }
  
  return 'medium';
}

// Cria relatório de erro
function createErrorReport(
  error: Error,
  componentStack?: string,
  metadata?: Record<string, unknown>
): ErrorReport {
  return {
    id: crypto.randomUUID(),
    message: error.message,
    stack: error.stack,
    componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    userId: localStorage.getItem('userId') ?? undefined,
    metadata,
    severity: determineSeverity(error),
    fingerprint: generateFingerprint(error),
  };
}

// Maps internal severity to the DB enum
const SEVERITY_MAP: Record<ErrorReport['severity'], string> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'critical',
};

// Envia batch de erros para a tabela error_logs via Supabase REST API
async function flushErrorBuffer(): Promise<void> {
  if (errorBuffer.length === 0) return;

  const batch: ErrorBatch = {
    errors: [...errorBuffer],
    sessionId,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };

  // Limpa buffer antes de enviar para evitar duplo envio em caso de erro
  errorBuffer.length = 0;

  if (import.meta.env.DEV) {
    logger.group('Error Report Batch');
    batch.errors.forEach(err => {
      logger.error(`[${err.severity.toUpperCase()}] ${err.message}`, err);
    });
    logger.groupEnd();
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  const rows = batch.errors.map(e => ({
    message: e.message.slice(0, 1000),
    stack: e.stack?.slice(0, 4000) ?? null,
    context: {
      componentStack: e.componentStack?.slice(0, 2000),
      fingerprint: e.fingerprint,
      sessionId: batch.sessionId,
      appVersion: batch.appVersion,
      ...e.metadata,
    },
    user_id: e.userId ?? null,
    severity: SEVERITY_MAP[e.severity] ?? 'error',
    url: e.url.slice(0, 500),
    user_agent: e.userAgent.slice(0, 500),
  }));

  try {
    await fetch(`${supabaseUrl}/rest/v1/error_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(rows),
    });
  } catch {
    // Never throw from error reporter — silently discard on network failure
  }
}

// Captura erro e adiciona ao buffer
export function captureError(
  error: Error,
  componentStack?: string,
  metadata?: Record<string, unknown>
): void {
  const report = createErrorReport(error, componentStack, metadata);
  
  // Deduplica por fingerprint (não reportar mesmo erro múltiplas vezes)
  const isDuplicate = errorBuffer.some(e => e.fingerprint === report.fingerprint);
  if (!isDuplicate) {
    errorBuffer.push(report);
  }
  
  // Flush imediato para erros críticos
  if (report.severity === 'critical' || errorBuffer.length >= MAX_BUFFER_SIZE) {
    flushErrorBuffer();
  }
}

// Captura exceções não tratadas
export function initGlobalErrorHandlers(): void {
  // Erros JavaScript não capturados
  window.addEventListener('error', (event) => {
    captureError(
      event.error || new Error(event.message),
      undefined,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
  
  // Promise rejections não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    captureError(error, undefined, { type: 'unhandledrejection' });
  });
  
  // Flush periódico
  setInterval(flushErrorBuffer, FLUSH_INTERVAL);
  
  // sendBeacon is more reliable on page unload than fetch
  window.addEventListener('beforeunload', () => {
    if (errorBuffer.length === 0) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey && import.meta.env.PROD) {
      const rows = errorBuffer.map(e => ({
        message: e.message.slice(0, 1000),
        stack: e.stack?.slice(0, 4000) ?? null,
        context: { fingerprint: e.fingerprint, sessionId },
        user_id: e.userId ?? null,
        severity: SEVERITY_MAP[e.severity] ?? 'error',
        url: e.url.slice(0, 500),
        user_agent: e.userAgent.slice(0, 500),
      }));
      navigator.sendBeacon(
        `${supabaseUrl}/rest/v1/error_logs?apikey=${supabaseKey}`,
        new Blob([JSON.stringify(rows)], { type: 'application/json' }),
      );
    }
    errorBuffer.length = 0;
  });
  
  // Flush ao visibility change (mobile)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushErrorBuffer();
    }
  });
}

export function clearUserContext() {
  try { localStorage.removeItem('userId'); } catch { /* quota/private */ }
}

// Hook para componentes React
export function useErrorReporter() {
  return {
    captureError,
    captureMessage: (message: string, severity: ErrorReport['severity'] = 'low') => {
      captureError(new Error(message), undefined, { customMessage: true, severity });
    },
    setUserContext: (userId: string) => {
      try { localStorage.setItem('userId', userId); } catch { /* quota/private */ }
    },
    clearUserContext,
  };
}


export type { ErrorReport, ErrorBatch };
