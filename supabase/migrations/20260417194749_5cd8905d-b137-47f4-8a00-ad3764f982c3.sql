CREATE TABLE IF NOT EXISTS public.conversational_search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  response JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  UNIQUE (user_id, query_hash)
);

CREATE INDEX IF NOT EXISTS idx_conv_search_cache_user_hash
  ON public.conversational_search_cache (user_id, query_hash);
CREATE INDEX IF NOT EXISTS idx_conv_search_cache_expires
  ON public.conversational_search_cache (expires_at);

ALTER TABLE public.conversational_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own conv cache"
  ON public.conversational_search_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own conv cache"
  ON public.conversational_search_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own conv cache"
  ON public.conversational_search_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own conv cache"
  ON public.conversational_search_cache FOR DELETE
  USING (auth.uid() = user_id);