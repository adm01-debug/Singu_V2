-- Create trigger_usage_history table to track which triggers and templates were used with each client
CREATE TABLE public.trigger_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  template_id TEXT,
  template_title TEXT,
  scenario TEXT,
  channel TEXT,
  context TEXT,
  result TEXT CHECK (result IN ('success', 'neutral', 'failure', 'pending')),
  notes TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trigger_usage_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own trigger usage history" 
ON public.trigger_usage_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trigger usage history" 
ON public.trigger_usage_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trigger usage history" 
ON public.trigger_usage_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trigger usage history" 
ON public.trigger_usage_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_contact_id ON public.trigger_usage_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_user_id ON public.trigger_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_used_at ON public.trigger_usage_history(used_at DESC);