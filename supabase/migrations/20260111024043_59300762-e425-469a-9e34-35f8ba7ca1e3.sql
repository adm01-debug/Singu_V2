-- Create compatibility_alerts table
CREATE TABLE public.compatibility_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  compatibility_score INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'below_threshold',
  title TEXT NOT NULL,
  description TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create compatibility_settings table to store user thresholds
CREATE TABLE public.compatibility_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  alert_threshold INTEGER NOT NULL DEFAULT 50,
  alert_only_important BOOLEAN DEFAULT true,
  important_min_relationship_score INTEGER DEFAULT 70,
  email_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compatibility_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for compatibility_alerts
CREATE POLICY "Users can view their own compatibility alerts"
ON public.compatibility_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own compatibility alerts"
ON public.compatibility_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compatibility alerts"
ON public.compatibility_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compatibility alerts"
ON public.compatibility_alerts FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for compatibility_settings
CREATE POLICY "Users can view their own compatibility settings"
ON public.compatibility_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own compatibility settings"
ON public.compatibility_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compatibility settings"
ON public.compatibility_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_compatibility_settings_updated_at
BEFORE UPDATE ON public.compatibility_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();