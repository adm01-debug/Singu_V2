-- Create table for emotional states history
CREATE TABLE public.emotional_states_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  emotional_state TEXT NOT NULL,
  confidence INTEGER DEFAULT 50,
  trigger TEXT,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for emotional anchors
CREATE TABLE public.emotional_anchors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('positive', 'negative')),
  trigger_word TEXT NOT NULL,
  emotional_state TEXT NOT NULL,
  context TEXT,
  strength INTEGER DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for client values
CREATE TABLE public.client_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  value_name TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  detected_phrases TEXT[],
  frequency INTEGER DEFAULT 1,
  last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id, category, value_name)
);

-- Create table for decision criteria
CREATE TABLE public.decision_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('must_have', 'nice_to_have', 'deal_breaker')),
  detected_from TEXT,
  how_to_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for hidden objections
CREATE TABLE public.hidden_objections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  objection_type TEXT NOT NULL,
  indicator TEXT NOT NULL,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  possible_real_objection TEXT,
  suggested_probe TEXT,
  resolution_templates TEXT[],
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emotional_states_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_objections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emotional_states_history
CREATE POLICY "Users can view their own emotional states history" 
ON public.emotional_states_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emotional states history" 
ON public.emotional_states_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotional states history" 
ON public.emotional_states_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for emotional_anchors
CREATE POLICY "Users can view their own emotional anchors" 
ON public.emotional_anchors FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emotional anchors" 
ON public.emotional_anchors FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotional anchors" 
ON public.emotional_anchors FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotional anchors" 
ON public.emotional_anchors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for client_values
CREATE POLICY "Users can view their own client values" 
ON public.client_values FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own client values" 
ON public.client_values FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client values" 
ON public.client_values FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client values" 
ON public.client_values FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for decision_criteria
CREATE POLICY "Users can view their own decision criteria" 
ON public.decision_criteria FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decision criteria" 
ON public.decision_criteria FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decision criteria" 
ON public.decision_criteria FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decision criteria" 
ON public.decision_criteria FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for hidden_objections
CREATE POLICY "Users can view their own hidden objections" 
ON public.hidden_objections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hidden objections" 
ON public.hidden_objections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hidden objections" 
ON public.hidden_objections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hidden objections" 
ON public.hidden_objections FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emotional_states_contact ON public.emotional_states_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_created ON public.emotional_states_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_anchors_contact ON public.emotional_anchors(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_values_contact ON public.client_values(contact_id);
CREATE INDEX IF NOT EXISTS idx_decision_criteria_contact ON public.decision_criteria(contact_id);
CREATE INDEX IF NOT EXISTS idx_hidden_objections_contact ON public.hidden_objections(contact_id);
CREATE INDEX IF NOT EXISTS idx_hidden_objections_resolved ON public.hidden_objections(resolved);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_nlp_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_client_values_updated_at
BEFORE UPDATE ON public.client_values
FOR EACH ROW
EXECUTE FUNCTION public.update_nlp_updated_at_column();

CREATE TRIGGER update_decision_criteria_updated_at
BEFORE UPDATE ON public.decision_criteria
FOR EACH ROW
EXECUTE FUNCTION public.update_nlp_updated_at_column();