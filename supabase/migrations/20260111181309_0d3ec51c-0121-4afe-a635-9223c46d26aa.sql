-- Create table for health alerts settings
CREATE TABLE public.health_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  critical_threshold INTEGER DEFAULT 30,
  warning_threshold INTEGER DEFAULT 50,
  check_frequency_hours INTEGER DEFAULT 24,
  notify_on_critical BOOLEAN DEFAULT true,
  notify_on_warning BOOLEAN DEFAULT false,
  email_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_health_settings UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.health_alert_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own health settings"
ON public.health_alert_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health settings"
ON public.health_alert_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health settings"
ON public.health_alert_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create table for health alerts history
CREATE TABLE public.health_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'critical',
  health_score INTEGER NOT NULL,
  previous_score INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  factors JSONB,
  dismissed BOOLEAN DEFAULT false,
  notified_via TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own health alerts"
ON public.health_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health alerts"
ON public.health_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health alerts"
ON public.health_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health alerts"
ON public.health_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on settings
CREATE TRIGGER update_health_alert_settings_updated_at
BEFORE UPDATE ON public.health_alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();