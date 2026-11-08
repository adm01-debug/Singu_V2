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
ALTER TABLE public.sales_goals            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.scheduled_visits       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.seller_daily_metrics   ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sla_violations         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tasks                  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.territory_assignments  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_badges            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_goals             ALTER COLUMN user_id SET NOT NULL;
