import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseApiError } from '@/lib/errorMessages';

export interface AskCrmMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: Record<string, unknown>[] | null;
  display_type?: 'table' | 'number' | 'list' | 'text';
  sql?: string | null;
  error?: string;
  timestamp: Date;
}

interface AskCrmResponse {
  answer: string;
  data: Record<string, unknown>[] | null;
  display_type: string;
  sql: string | null;
  error?: string;
}

export function useAskCrm() {
  const [messages, setMessages] = useState<AskCrmMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const ask = useCallback(async (question: string) => {
    const userMsg: AskCrmMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-crm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errData.error || `Erro ${response.status}`);
      }

      const result: AskCrmResponse = await response.json();

      const assistantMsg: AskCrmMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.answer,
        data: result.data,
        display_type: (result.display_type as AskCrmMessage['display_type']) || 'text',
        sql: result.sql,
        error: result.error,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMsg: AskCrmMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: parseApiError(err, 'Erro ao processar pergunta'),
        error: 'true',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, loading, ask, clearMessages };
}
