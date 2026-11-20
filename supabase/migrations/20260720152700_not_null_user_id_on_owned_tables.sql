-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260720152700
-- nome:   not_null_user_id_on_owned_tables

-- Migration: NOT NULL on user_id for 22 user-owned tables
-- All verified to have zero NULL user_id rows in live data.
-- Without NOT NULL, a bug or direct SQL INSERT could create orphaned rows
-- invisible to RLS (auth.uid() = user_id never matches NULL).
-- Skipped: relationship_score_history (7 NULLs), churn_predictions (6),
--          interaction_templates (3), deal_velocity_analysis (1) — need cleanup first.

ALTER TABLE public.activity_feed          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.cadence_enrollments    ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.commissions            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.company_cadences       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.deals                  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.documents              ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.favorites              ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.meetings               ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.notifications          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.proposals              ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.quick_notes            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.reminders              ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sales_forecasts        ALTER COLUMN user_id SET NOT NULL;
-- Compat: sales_goals surgiu (salespro_mig_003) sem user_id; producao o tem (types.ts).
ALTER TABLE public.sales_goals ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.sales_goals            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.scheduled_visits       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.seller_daily_metrics   ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sla_violations         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tasks                  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.territory_assignments  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_badges            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_goals             ALTER COLUMN user_id SET NOT NULL;
