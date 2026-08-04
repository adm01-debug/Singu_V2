-- AI Assistant: conversational threads with persistent history

CREATE TABLE public.ai_chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  context_entity_type TEXT,
  context_entity_id UUID,
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.ai_chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_user ON public.ai_chat_threads(user_id, archived, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_thread ON public.ai_chat_messages(thread_id, created_at);

ALTER TABLE public.ai_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own threads" ON public.ai_chat_threads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own messages" ON public.ai_chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_chat_threads_updated_at
  BEFORE UPDATE ON public.ai_chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();