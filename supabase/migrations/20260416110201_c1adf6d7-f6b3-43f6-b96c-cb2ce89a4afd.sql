
CREATE TABLE public.knowledge_base_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own kb articles" ON public.knowledge_base_articles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
