import { supabase } from "@/integrations/supabase/client";

/**
 * Logger centralizado — suprime output em produção no console,
 * mas envia erros para o banco de dados (tabela error_logs).
 */

const isDev = import.meta.env.DEV;

let _requestId: string | null = null;
let _userId: string | null = null;

/** Set a correlation ID for the current request/operation flow */
export function setRequestId(id: string) {
  _requestId = id;
}

/** Set the current user ID for logging */
export function setLogUser(id: string | null) {
  _userId = id;
}

/** Generate a short unique request ID */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

async function persistError(message: string, severity: 'info' | 'warning' | 'error' | 'critical', args: unknown[]) {
  try {
    const errorObj = args.find(a => a instanceof Error) as Error | undefined;
    // Converte para string para garantir compatibilidade com o tipo Json do Supabase
    const contextStr = JSON.stringify(args.filter(a => !(a instanceof Error)));

     await supabase.from?.('error_logs').insert([{
      message,
      severity,
      stack: errorObj?.stack || null,
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      user_id: _userId || null,
      context: {
        rid: _requestId,
        extra: contextStr,
        timestamp: new Date().toISOString()
      }
    }]);
  } catch (err) {
    // Falha silenciosa no logger para evitar loop infinito
    if (isDev) console.error('[Logger] Falha ao persistir erro no banco:', err);
  }
}

function formatArgs(level: string, args: unknown[]): unknown[] {
  if (!isDev) return args;
  const meta: Record<string, string> = {
    ts: new Date().toISOString(),
    level,
  };
  if (_requestId) meta.rid = _requestId;
  return [`[${meta.ts}] [${level.toUpperCase()}]${_requestId ? ` [${_requestId}]` : ''}`, ...args];
}

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDev) console.error(...formatArgs('error', [message, ...args]));
    persistError(message, 'error', args);
  },
  critical: (message: string, ...args: unknown[]) => {
    if (isDev) console.error(...formatArgs('critical', [message, ...args]));
    persistError(message, 'critical', args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(...formatArgs('warn', [message, ...args]));
    // Em prod, persistimos apenas se for aviso importante ou erro
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(...formatArgs('info', [message, ...args]));
  },
  log: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(...formatArgs('log', [message, ...args]));
  },
  group: (label: string) => {
    if (isDev) console.group(label);
  },
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
  structured: (event: string, data?: Record<string, unknown>) => {
    if (isDev) {
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event,
        rid: _requestId,
        ...data,
      }));
    }
  },
} as const;
