
-- Deals/Opportunities table for Pipeline Kanban
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  stage TEXT NOT NULL DEFAULT 'lead',
  priority TEXT DEFAULT 'medium',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  closed_at TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  stage_entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals" ON public.deals FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
