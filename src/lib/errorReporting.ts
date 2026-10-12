/**
 * Sistema de Monitoramento de Erros em Produção
 * Captura, agrega e reporta erros para análise
 */
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

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
let reportingSession: Session | null = null;
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
    userId: (() => { try { return localStorage.getItem('userId') ?? undefined; } catch { return undefined; } })(),
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
async function flushErrorBuffer(keepalive = false): Promise<void> {
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
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const session = keepalive ? reportingSession : (await supabase.auth.getSession()).data.session;
    if (!session || (keepalive && session.expires_at && session.expires_at * 1000 <= Date.now())) return;

    const rows = batch.errors.filter(e => !e.userId || e.userId === session.user.id).map(e => ({
      message: e.message.slice(0, 1000),
      stack: e.stack?.slice(0, 4000) ?? null,
      context: {
        componentStack: e.componentStack?.slice(0, 2000),
        fingerprint: e.fingerprint,
        sessionId: batch.sessionId,
        appVersion: batch.appVersion,
        ...e.metadata,
      },
      user_id: session.user.id,
      severity: SEVERITY_MAP[e.severity] ?? 'error',
      url: e.url.slice(0, 500),
      user_agent: e.userAgent.slice(0, 500),
    }));
    if (rows.length === 0) return;

    await fetch(`${supabaseUrl}/rest/v1/error_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(rows),
      keepalive,
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
  supabase.auth.onAuthStateChange((_event, session) => {
    if (reportingSession && reportingSession.user.id !== session?.user.id) errorBuffer.length = 0;
    reportingSession = session;
  });
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
  
  window.addEventListener('beforeunload', () => {
    void flushErrorBuffer(true);
  });
  
  // Flush ao visibility change (mobile)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushErrorBuffer();
    }
  });
}

export function clearUserContext() {
  errorBuffer.length = 0;
  reportingSession = null;
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
