import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  context_entity_type: string | null;
  context_entity_id: string | null;
  pinned: boolean;
  archived: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  tokens_used: number | null;
  created_at: string;
}

export function useAiAssistant() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchThreads = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_chat_threads')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('pinned', { ascending: false })
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      setThreads((data || []) as ChatThread[]);
    } catch (e) {
      logger.error('Failed to fetch threads', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);
    } catch (e) {
      logger.error('Failed to fetch messages', e);
    }
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  useEffect(() => {
    if (activeThreadId) fetchMessages(activeThreadId);
    else setMessages([]);
  }, [activeThreadId, fetchMessages]);

  const createThread = useCallback(async (title?: string, context?: { type: string; id: string }) => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from('ai_chat_threads')
        .insert({
          user_id: user.id,
          title: title || 'Nova conversa',
          context_entity_type: context?.type || null,
          context_entity_id: context?.id || null,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar conversa");
      const newThread = data as ChatThread;
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      return newThread;
    } catch (e) {
      logger.error('Failed to create thread', e);
      toast.error('Falha ao criar conversa');
      return null;
    }
  }, [user?.id]);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeThreadId || !user?.id) return;
    const thread = threads.find(t => t.id === activeThreadId);

    const optimisticUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      thread_id: activeThreadId,
      user_id: user.id,
      role: 'user',
      content,
      metadata: {},
      tokens_used: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMsg]);
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            thread_id: activeThreadId,
            message: content,
            context_entity_type: thread?.context_entity_type || undefined,
            context_entity_id: thread?.context_entity_id || undefined,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      // Reload to get persisted messages
      await fetchMessages(activeThreadId);
      await fetchThreads();
      return result;
    } catch (e) {
      logger.error('Failed to send message', e);
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar mensagem');
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
    } finally {
      setSending(false);
    }
  }, [activeThreadId, user?.id, threads, fetchMessages, fetchThreads]);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      const { error } = await supabase.from('ai_chat_threads').delete().eq('id', threadId);
      if (error) throw error;
      setThreads(prev => prev.filter(t => t.id !== threadId));
      if (activeThreadId === threadId) setActiveThreadId(null);
      toast.success('Conversa removida');
    } catch (e) {
      logger.error('Failed to delete thread', e);
      toast.error('Falha ao remover conversa');
    }
  }, [activeThreadId]);

  const togglePin = useCallback(async (threadId: string, pinned: boolean) => {
    try {
      const { error } = await supabase.from('ai_chat_threads').update({ pinned: !pinned }).eq('id', threadId);
      if (error) throw error;
      await fetchThreads();
    } catch (e) {
      logger.error('Failed to toggle pin', e);
    }
  }, [fetchThreads]);

  const renameThread = useCallback(async (threadId: string, title: string) => {
    try {
      const { error } = await supabase.from('ai_chat_threads').update({ title }).eq('id', threadId);
      if (error) throw error;
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title } : t));
    } catch (e) {
      logger.error('Failed to rename thread', e);
    }
  }, []);

  return {
    threads,
    activeThreadId,
    setActiveThreadId,
    messages,
    loading,
    sending,
    createThread,
    sendMessage,
    deleteThread,
    togglePin,
    renameThread,
    refresh: fetchThreads,
  };
}
