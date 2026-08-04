-- Create table for purchase history
CREATE TABLE public.purchase_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_category TEXT,
  amount DECIMAL(12,2),
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  renewal_date TIMESTAMP WITH TIME ZONE,
  cycle_months INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for communication preferences
CREATE TABLE public.communication_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  preferred_channel TEXT NOT NULL DEFAULT 'whatsapp',
  preferred_days TEXT[] DEFAULT '{}',
  preferred_time_start TIME,
  preferred_time_end TIME,
  contact_frequency TEXT DEFAULT 'weekly',
  avoid_days TEXT[] DEFAULT '{}',
  notes TEXT,
  response_rate_by_channel JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

-- Create table for life events tracking
CREATE TABLE public.life_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 7,
  last_reminded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for best contact time analysis
CREATE TABLE public.contact_time_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  hour_of_day INTEGER NOT NULL,
  success_count INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id, day_of_week, hour_of_day)
);

-- Create table for personalized offer suggestions
CREATE TABLE public.offer_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  offer_name TEXT NOT NULL,
  offer_category TEXT,
  reason TEXT NOT NULL,
  confidence_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  presented_at TIMESTAMP WITH TIME ZONE,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_time_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_history
CREATE POLICY "Users can view their own purchase history" ON public.purchase_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchase history" ON public.purchase_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchase history" ON public.purchase_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchase history" ON public.purchase_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for communication_preferences
CREATE POLICY "Users can view their own communication preferences" ON public.communication_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own communication preferences" ON public.communication_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own communication preferences" ON public.communication_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own communication preferences" ON public.communication_preferences FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for life_events
CREATE POLICY "Users can view their own life events" ON public.life_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own life events" ON public.life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own life events" ON public.life_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own life events" ON public.life_events FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contact_time_analysis
CREATE POLICY "Users can view their own contact time analysis" ON public.contact_time_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contact time analysis" ON public.contact_time_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contact time analysis" ON public.contact_time_analysis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contact time analysis" ON public.contact_time_analysis FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for offer_suggestions
CREATE POLICY "Users can view their own offer suggestions" ON public.offer_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own offer suggestions" ON public.offer_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own offer suggestions" ON public.offer_suggestions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own offer suggestions" ON public.offer_suggestions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_history_contact ON public.purchase_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_user ON public.purchase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_preferences_contact ON public.communication_preferences(contact_id);
CREATE INDEX IF NOT EXISTS idx_life_events_contact ON public.life_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_life_events_date ON public.life_events(event_date);
CREATE INDEX IF NOT EXISTS idx_contact_time_analysis_contact ON public.contact_time_analysis(contact_id);
CREATE INDEX IF NOT EXISTS idx_offer_suggestions_contact ON public.offer_suggestions(contact_id);
CREATE INDEX IF NOT EXISTS idx_offer_suggestions_status ON public.offer_suggestions(status);