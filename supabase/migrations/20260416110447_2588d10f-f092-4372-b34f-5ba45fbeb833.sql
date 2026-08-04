
CREATE TABLE public.canned_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  shortcut TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own canned responses" ON public.canned_responses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
