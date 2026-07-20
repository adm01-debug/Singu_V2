-- Migration: NOT NULL on user_id for user-owned tables
-- Prevents orphaned rows (invisible to RLS where auth.uid() = user_id never matches NULL).
--
-- Part 1: 22 tables already had zero NULL rows — constraint added directly.
-- Part 2: 3 analytics tables had NULL user_ids set by background jobs;
--         backfilled via contact_id → contacts.user_id, then constrained.
-- Excluded: interaction_templates — is_public=true rows are system seed
--           templates intentionally without a per-user owner.

-- ============================================================
-- PART 1 — Tables with zero NULL user_id rows (safe direct constraint)
-- ============================================================

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

-- ============================================================
-- PART 2 — Analytics tables: backfill via contact owner, then constrain
-- ============================================================

UPDATE public.relationship_score_history rsh
SET user_id = c.user_id
FROM public.contacts c
WHERE rsh.contact_id = c.id
  AND rsh.user_id IS NULL;

UPDATE public.churn_predictions cp
SET user_id = c.user_id
FROM public.contacts c
WHERE cp.contact_id = c.id
  AND cp.user_id IS NULL;

UPDATE public.deal_velocity_analysis dv
SET user_id = c.user_id
FROM public.contacts c
WHERE dv.contact_id = c.id
  AND dv.user_id IS NULL;

ALTER TABLE public.relationship_score_history ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.churn_predictions          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.deal_velocity_analysis     ALTER COLUMN user_id SET NOT NULL;
