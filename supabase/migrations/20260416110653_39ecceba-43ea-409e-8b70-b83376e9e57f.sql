
CREATE TABLE public.nurturing_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'tag_added', 'stage_changed', 'score_below', 'score_above')),
  trigger_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  steps JSONB DEFAULT '[]',
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.nurturing_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.nurturing_workflows(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, contact_id)
);

ALTER TABLE public.nurturing_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurturing_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own nurturing workflows" ON public.nurturing_workflows FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own nurturing enrollments" ON public.nurturing_enrollments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
