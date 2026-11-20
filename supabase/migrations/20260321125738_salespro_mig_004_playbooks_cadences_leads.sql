-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321125738
-- nome:   salespro_mig_004_playbooks_cadences_leads

CREATE TABLE IF NOT EXISTS public.playbooks (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, stage TEXT NOT NULL, title TEXT NOT NULL, description TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.playbook_items (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE, content TEXT NOT NULL, item_order INTEGER NOT NULL DEFAULT 0, is_required BOOLEAN NOT NULL DEFAULT false, item_type TEXT NOT NULL DEFAULT 'checklist', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.playbook_progress (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, playbook_item_id UUID NOT NULL REFERENCES public.playbook_items(id) ON DELETE CASCADE, sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), completed_by UUID REFERENCES public.salespeople(id), UNIQUE(playbook_item_id, sale_id));
CREATE TABLE IF NOT EXISTS public.lead_scores (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, score INTEGER NOT NULL DEFAULT 0, factors JSONB NOT NULL DEFAULT '{}', calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(sale_id));
CREATE TABLE IF NOT EXISTS public.objections_library (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, objection TEXT NOT NULL, response TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general', effectiveness_score INTEGER DEFAULT 0, usage_count INTEGER DEFAULT 0, created_by UUID REFERENCES public.salespeople(id), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.notification_preferences (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, email TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true, frequency TEXT NOT NULL DEFAULT 'daily', notify_stagnant_deals BOOLEAN NOT NULL DEFAULT true, notify_inactive_clients BOOLEAN NOT NULL DEFAULT true, notify_at_risk_goals BOOLEAN NOT NULL DEFAULT true, stagnant_threshold_days INTEGER NOT NULL DEFAULT 14, inactive_threshold_days INTEGER NOT NULL DEFAULT 60, preferred_time TIME NOT NULL DEFAULT '08:00:00', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT valid_frequency CHECK (frequency IN ('realtime', 'daily', 'weekly')));

-- RENAMED: sales_activities (was 'activities' - conflicts with SINGU)
CREATE TABLE IF NOT EXISTS public.sales_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL,
  activity_type activity_type NOT NULL, outcome activity_outcome NOT NULL,
  notes TEXT, duration_minutes INTEGER, contact_name TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE, deleted_by UUID REFERENCES auth.users, delete_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_activities_sale ON public.sales_activities(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_sp ON public.sales_activities(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_type ON public.sales_activities(activity_type);
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sales_activities_all" ON public.sales_activities FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RENAMED: sales_tasks (was 'tasks' - conflicts with SINGU)
CREATE TABLE IF NOT EXISTS public.sales_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, description TEXT,
  type task_type NOT NULL DEFAULT 'other', priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE, completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE, deleted_by UUID REFERENCES auth.users, delete_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_tasks_sp ON public.sales_tasks(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_sales_tasks_status ON public.sales_tasks(status);
CREATE INDEX IF NOT EXISTS idx_sales_tasks_due ON public.sales_tasks(due_date);
ALTER TABLE public.sales_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sales_tasks_all" ON public.sales_tasks FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.cadences (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.cadence_steps (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE, day_number INTEGER NOT NULL DEFAULT 1, action_type TEXT NOT NULL CHECK (action_type IN ('email','call','linkedin','whatsapp','meeting','other')), title TEXT NOT NULL, description TEXT, template_content TEXT, step_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.prospect_cadences (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE, salesperson_id UUID REFERENCES public.salespeople(id), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')), started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), current_step INTEGER NOT NULL DEFAULT 0, next_action_date DATE, completed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(sale_id, cadence_id));
CREATE TABLE IF NOT EXISTS public.cadence_tasks (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, prospect_cadence_id UUID NOT NULL REFERENCES public.prospect_cadences(id) ON DELETE CASCADE, cadence_step_id UUID NOT NULL REFERENCES public.cadence_steps(id) ON DELETE CASCADE, scheduled_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped')), completed_at TIMESTAMP WITH TIME ZONE, notes TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.activity_goals (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, calls_goal INTEGER NOT NULL DEFAULT 30, emails_goal INTEGER NOT NULL DEFAULT 20, meetings_goal INTEGER NOT NULL DEFAULT 3, linkedin_goal INTEGER NOT NULL DEFAULT 10, whatsapp_goal INTEGER NOT NULL DEFAULT 15, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(salesperson_id));

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "playbooks_all" ON public.playbooks FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "cadences_all" ON public.cadences FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "activity_goals_all" ON public.activity_goals FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
