-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321133834
-- nome:   create_singu_tables_batch3_of_3

-- 28-30. Trigger tables
CREATE TABLE IF NOT EXISTS public.trigger_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  disc_profile TEXT,
  variant_a_trigger TEXT NOT NULL,
  variant_a_template TEXT,
  variant_a_uses INTEGER DEFAULT 0,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_a_avg_rating NUMERIC(3,2) DEFAULT 0,
  variant_b_trigger TEXT NOT NULL,
  variant_b_template TEXT,
  variant_b_uses INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  variant_b_avg_rating NUMERIC(3,2) DEFAULT 0,
  winner TEXT CHECK (winner IN ('A', 'B', 'tie')),
  confidence NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.trigger_ab_tests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_user_contact ON public.trigger_ab_tests(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_disc ON public.trigger_ab_tests(disc_profile);
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_active ON public.trigger_ab_tests(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.trigger_intensity_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  intensity_level INTEGER NOT NULL CHECK (intensity_level BETWEEN 1 AND 5),
  result TEXT CHECK (result IN ('success', 'neutral', 'failure', 'resistance')),
  notes TEXT,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.trigger_intensity_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_history_user_contact ON public.trigger_intensity_history(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_history_trigger ON public.trigger_intensity_history(trigger_type);

CREATE TABLE IF NOT EXISTS public.trigger_channel_effectiveness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'call', 'meeting', 'linkedin', 'sms')),
  uses INTEGER DEFAULT 0,
  successes INTEGER DEFAULT 0,
  effectiveness_score NUMERIC(5,2) DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id, trigger_type, channel)
);
ALTER TABLE public.trigger_channel_effectiveness ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_trigger_channel_effectiveness_user_contact ON public.trigger_channel_effectiveness(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_channel_effectiveness_trigger_channel ON public.trigger_channel_effectiveness(trigger_type, channel);

-- 31. contact_relatives
CREATE TABLE IF NOT EXISTS public.contact_relatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  age INTEGER,
  birthday DATE,
  phone TEXT,
  email TEXT,
  occupation TEXT,
  company TEXT,
  notes TEXT,
  is_decision_influencer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_relatives ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_contact_relatives_user_id ON public.contact_relatives(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_relatives_contact_id ON public.contact_relatives(contact_id);

-- 32-34. WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  instance_name text NOT NULL,
  remote_jid text NOT NULL,
  message_id text,
  from_me boolean NOT NULL DEFAULT false,
  message_type text NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  media_mimetype text,
  status text DEFAULT 'pending',
  sender_name text,
  quoted_message_id text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  played_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_contact ON public.whatsapp_messages(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_remote_jid ON public.whatsapp_messages(remote_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance ON public.whatsapp_messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);

CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  display_name text,
  phone_number text,
  status text DEFAULT 'disconnected',
  profile_pic_url text,
  webhook_url text,
  auto_read_messages boolean DEFAULT false,
  auto_reply_enabled boolean DEFAULT false,
  auto_reply_message text,
  settings jsonb DEFAULT '{}'::jsonb,
  last_connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, instance_name)
);
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user ON public.whatsapp_instances(user_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_read integer DEFAULT 0,
  avg_response_time_seconds integer,
  delivery_rate numeric,
  read_rate numeric,
  unique_contacts integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_kpis ENABLE ROW LEVEL SECURITY;

-- 35. lux_intelligence
CREATE TABLE IF NOT EXISTS public.lux_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company')),
  entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  request_type text NOT NULL DEFAULT 'full_scan',
  social_profiles jsonb DEFAULT '[]'::jsonb,
  social_analysis jsonb DEFAULT '{}'::jsonb,
  fiscal_data jsonb DEFAULT '{}'::jsonb,
  stakeholders jsonb DEFAULT '[]'::jsonb,
  audience_analysis jsonb DEFAULT '{}'::jsonb,
  personal_profile jsonb DEFAULT '{}'::jsonb,
  ai_report text,
  ai_summary text,
  fields_updated jsonb DEFAULT '[]'::jsonb,
  error_message text,
  n8n_execution_id text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.lux_intelligence ENABLE ROW LEVEL SECURITY;

-- 36. automation_rules (MUST be before automation_logs — FK dependency)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- 37. automation_logs (FK → automation_rules)
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_entity_type TEXT NOT NULL,
  trigger_entity_id UUID NOT NULL,
  actions_executed JSONB NOT NULL DEFAULT '[]'::jsonb,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE TRIGGER set_updated_at_client_values BEFORE UPDATE ON public.client_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_compatibility_settings BEFORE UPDATE ON public.compatibility_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_contact_cadence BEFORE UPDATE ON public.contact_cadence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_contact_preferences BEFORE UPDATE ON public.contact_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_contact_relatives BEFORE UPDATE ON public.contact_relatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_disc_conversion_metrics BEFORE UPDATE ON public.disc_conversion_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_health_alert_settings BEFORE UPDATE ON public.health_alert_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_lux_intelligence BEFORE UPDATE ON public.lux_intelligence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_rfm_analysis BEFORE UPDATE ON public.rfm_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_social_profiles BEFORE UPDATE ON public.social_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_social_scraping_schedule BEFORE UPDATE ON public.social_scraping_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_trigger_ab_tests BEFORE UPDATE ON public.trigger_ab_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_trigger_channel_effectiveness BEFORE UPDATE ON public.trigger_channel_effectiveness FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_weekly_report_settings BEFORE UPDATE ON public.weekly_report_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_whatsapp_instances BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_whatsapp_messages BEFORE UPDATE ON public.whatsapp_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_automation_rules BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
