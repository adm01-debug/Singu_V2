-- Create table for weekly report settings
CREATE TABLE public.weekly_report_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enabled BOOLEAN DEFAULT true,
  send_day TEXT DEFAULT 'monday',
  send_time TEXT DEFAULT '09:00',
  email_address TEXT,
  include_portfolio_summary BOOLEAN DEFAULT true,
  include_at_risk_clients BOOLEAN DEFAULT true,
  include_health_alerts BOOLEAN DEFAULT true,
  include_upcoming_dates BOOLEAN DEFAULT true,
  include_recommendations BOOLEAN DEFAULT true,
  include_performance_metrics BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_report_settings UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.weekly_report_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own report settings"
ON public.weekly_report_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own report settings"
ON public.weekly_report_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report settings"
ON public.weekly_report_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create table for weekly report history
CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_data JSONB NOT NULL,
  sent_via TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reports"
ON public.weekly_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
ON public.weekly_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_weekly_report_settings_updated_at
BEFORE UPDATE ON public.weekly_report_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();