-- Baseline das tabelas que existem em producao (src/integrations/supabase/types.ts)
-- mas cujos DDLs nao foram recuperados dos replays (tabelas orfas da auditoria).
-- Shapes fieis ao types.ts; idempotente (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS public.inactivity_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  company_id UUID,
  contact_id UUID,
  created_at TIMESTAMPTZ,
  days_inactive INTEGER,
  detected_at TIMESTAMPTZ,
  last_interaction_date TIMESTAMPTZ,
  recommended_actions JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  risk_score INTEGER,
  severity TEXT,
  status TEXT,
  updated_at TIMESTAMPTZ,
  urgency_reason TEXT
);
ALTER TABLE public.inactivity_alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actions_executed JSONB,
  created_at TIMESTAMPTZ,
  entity_id UUID,
  entity_type TEXT,
  error_message TEXT,
  execution_time_ms INTEGER,
  input_data JSONB,
  rule_id UUID,
  status TEXT,
  trigger_type TEXT NOT NULL
);
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sales_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actual_value NUMERIC,
  assumptions JSONB,
  confidence_level NUMERIC,
  created_at TIMESTAMPTZ,
  forecast_month DATE NOT NULL,
  forecast_type TEXT,
  predicted_value NUMERIC,
  updated_at TIMESTAMPTZ,
  user_id UUID NOT NULL
);
ALTER TABLE public.sales_forecasts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ,
  created_by UUID,
  credentials JSONB,
  is_active BOOLEAN,
  last_sync_at TIMESTAMPTZ,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  settings JSONB,
  sync_error TEXT,
  sync_status TEXT,
  type TEXT NOT NULL,
  updated_at TIMESTAMPTZ
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sales_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_to UUID,
  company_id UUID,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ,
  description TEXT,
  due_date TIMESTAMPTZ,
  estimated_value NUMERIC,
  identified_by UUID,
  metadata JSONB,
  notes TEXT,
  opportunity_type TEXT NOT NULL,
  priority TEXT,
  source TEXT,
  status TEXT,
  title TEXT NOT NULL,
  updated_at TIMESTAMPTZ
);
ALTER TABLE public.sales_opportunities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  body TEXT NOT NULL,
  category TEXT,
  channel TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  created_by UUID,
  is_active BOOLEAN,
  name TEXT NOT NULL,
  subject TEXT,
  updated_at TIMESTAMPTZ,
  use_count INTEGER,
  variables TEXT[]
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.smart_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cached_count INTEGER,
  created_at TIMESTAMPTZ,
  created_by UUID,
  description TEXT,
  entity_type TEXT,
  filters JSONB NOT NULL,
  is_dynamic BOOLEAN,
  last_calculated_at TIMESTAMPTZ,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ
);
ALTER TABLE public.smart_segments ENABLE ROW LEVEL SECURITY;

