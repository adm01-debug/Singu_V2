-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321123053
-- nome:   salespro_batch1b_playbooks_cadences_achievements

CREATE TABLE IF NOT EXISTS public.objections_library (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, objection TEXT NOT NULL, response TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general', effectiveness_score INTEGER DEFAULT 0, usage_count INTEGER DEFAULT 0, created_by UUID REFERENCES public.salespeople(id), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.notification_preferences (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, email TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true, frequency TEXT NOT NULL DEFAULT 'daily', notify_stagnant_deals BOOLEAN NOT NULL DEFAULT true, notify_inactive_clients BOOLEAN NOT NULL DEFAULT true, notify_at_risk_goals BOOLEAN NOT NULL DEFAULT true, stagnant_threshold_days INTEGER NOT NULL DEFAULT 14, inactive_threshold_days INTEGER NOT NULL DEFAULT 60, preferred_time TIME NOT NULL DEFAULT '08:00:00', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT valid_frequency CHECK (frequency IN ('realtime', 'daily', 'weekly')));

CREATE TABLE IF NOT EXISTS public.playbooks (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, stage TEXT NOT NULL, title TEXT NOT NULL, description TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.playbook_items (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE, content TEXT NOT NULL, item_order INTEGER NOT NULL DEFAULT 0, is_required BOOLEAN NOT NULL DEFAULT false, item_type TEXT NOT NULL DEFAULT 'checklist', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.playbook_progress (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, playbook_item_id UUID NOT NULL REFERENCES public.playbook_items(id) ON DELETE CASCADE, sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), completed_by UUID REFERENCES public.salespeople(id), UNIQUE(playbook_item_id, sale_id));

CREATE TABLE IF NOT EXISTS public.lead_scores (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, score INTEGER NOT NULL DEFAULT 0, factors JSONB NOT NULL DEFAULT '{}', calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(sale_id));

CREATE TABLE IF NOT EXISTS public.lead_routing_log (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, from_salesperson_id UUID REFERENCES public.salespeople(id), to_salesperson_id UUID REFERENCES public.salespeople(id), routing_reason TEXT NOT NULL, notes TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.cadences (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.cadence_steps (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE, day_number INTEGER NOT NULL DEFAULT 1, action_type TEXT NOT NULL CHECK (action_type IN ('email', 'call', 'linkedin', 'whatsapp', 'meeting', 'other')), title TEXT NOT NULL, description TEXT, template_content TEXT, step_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.prospect_cadences (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE, salesperson_id UUID REFERENCES public.salespeople(id), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')), started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), current_step INTEGER NOT NULL DEFAULT 0, next_action_date DATE, completed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(sale_id, cadence_id));

CREATE TABLE IF NOT EXISTS public.cadence_tasks (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, prospect_cadence_id UUID NOT NULL REFERENCES public.prospect_cadences(id) ON DELETE CASCADE, cadence_step_id UUID NOT NULL REFERENCES public.cadence_steps(id) ON DELETE CASCADE, scheduled_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')), completed_at TIMESTAMP WITH TIME ZONE, notes TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.activity_goals (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, calls_goal INTEGER NOT NULL DEFAULT 30, emails_goal INTEGER NOT NULL DEFAULT 20, meetings_goal INTEGER NOT NULL DEFAULT 3, linkedin_goal INTEGER NOT NULL DEFAULT 10, whatsapp_goal INTEGER NOT NULL DEFAULT 15, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(salesperson_id));

CREATE TABLE IF NOT EXISTS public.achievements (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, achievement_type TEXT NOT NULL DEFAULT 'daily_goal', achievement_date DATE NOT NULL DEFAULT CURRENT_DATE, details JSONB DEFAULT '{}', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.salesperson_xp (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL UNIQUE REFERENCES public.salespeople(id) ON DELETE CASCADE, total_xp INTEGER NOT NULL DEFAULT 0, current_level INTEGER NOT NULL DEFAULT 1, xp_to_next_level INTEGER NOT NULL DEFAULT 100, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.xp_history (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, xp_amount INTEGER NOT NULL, source_type TEXT NOT NULL, source_id TEXT, description TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.icp_data (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE, ramo_atividade TEXT, grupo_nicho TEXT, capital_social DECIMAL(15,2), num_colaboradores INTEGER, is_icp_match BOOLEAN DEFAULT false, bitrix_id TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
