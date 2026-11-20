-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260720152808
-- nome:   backfill_and_not_null_user_id_analytics_tables

-- Migration: backfill NULL user_id via contact owner, then add NOT NULL
-- relationship_score_history, churn_predictions, deal_velocity_analysis
-- All 14 orphaned rows traced to the same contact owner via contacts.user_id.
-- interaction_templates intentionally excluded: is_public=true rows are
-- system-wide seed templates with no per-user owner.

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

-- Now safe to add NOT NULL (zero NULLs remain after backfill)
ALTER TABLE public.relationship_score_history ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.churn_predictions          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.deal_velocity_analysis     ALTER COLUMN user_id SET NOT NULL;
