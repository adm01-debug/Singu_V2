-- 1. Selective EXECUTE permissions
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, authenticated, anon;

GRANT EXECUTE ON FUNCTION public.compute_attribution(text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_relationship_consistency(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_behavior_gaps(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_behavioral_consistency(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_framework_gaps(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_life_event_gaps(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_conversation_topics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_account_health(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cs_renewal_pipeline(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_forecast_period(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_funnel_stats(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_mql(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_contact_in_workflow(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_revops_kpis(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_revops_alert(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_score_explicability(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_contacts_unaccent(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_companies_unaccent(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_interactions_unaccent(uuid, text, integer) TO authenticated;

GRANT EXECUTE ON FUNCTION public.increment_magnet_view(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_magnet_download(text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_form_view(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_form(text, jsonb, jsonb, text, text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.move_deal_atomic(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_deal_atomic(uuid, text, numeric) TO authenticated;

-- 2. Convert views to SECURITY INVOKER
DROP VIEW IF EXISTS public.forms_public CASCADE;
CREATE VIEW public.forms_public WITH (security_invoker = true) AS
SELECT id, slug, name, description, fields, redirect_url, success_message
FROM public.forms
WHERE is_published = true;

DROP VIEW IF EXISTS public.landing_pages_public CASCADE;
CREATE VIEW public.landing_pages_public WITH (security_invoker = true) AS
SELECT id, slug, title, description, blocks, theme, redirect_url
FROM public.landing_pages
WHERE is_published = true;

DROP VIEW IF EXISTS public.csat_surveys_public CASCADE;
CREATE VIEW public.csat_surveys_public WITH (security_invoker = true) AS
SELECT id, public_token, channel, status, score, sent_at, expires_at
FROM public.csat_surveys
WHERE public_token IS NOT NULL AND (expires_at IS NULL OR expires_at > now());

DROP VIEW IF EXISTS public.document_signatures_public CASCADE;
CREATE VIEW public.document_signatures_public WITH (security_invoker = true) AS
SELECT id, signature_token, signer_name, signer_email, rendered_html, status, viewed_at, signed_at, expires_at
FROM public.document_signatures
WHERE signature_token IS NOT NULL AND status <> ALL (ARRAY['declined'::text, 'expired'::text]) AND (expires_at IS NULL OR expires_at > now());

DROP VIEW IF EXISTS public.vw_contacts_nlp CASCADE;
CREATE VIEW public.vw_contacts_nlp WITH (security_invoker = true) AS
SELECT c.id as contact_id, c.first_name, c.last_name, c.vak_dominant, c.motivation_direction, c.working_style, c.user_id
FROM public.contacts c;

-- Restore dependent function search_contacts_by_nlp (using updated column names)
CREATE OR REPLACE FUNCTION public.search_contacts_by_nlp(p_user_id uuid, p_vak_primary text DEFAULT NULL::text, p_metaprogram_motivation text DEFAULT NULL::text, p_working_style text DEFAULT NULL::text)
 RETURNS SETOF vw_contacts_nlp
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT v.*
    FROM public.vw_contacts_nlp v
    WHERE 
        v.user_id = p_user_id
        AND (p_vak_primary IS NULL OR v.vak_dominant = p_vak_primary)
        AND (p_metaprogram_motivation IS NULL OR v.motivation_direction = p_metaprogram_motivation)
        AND (p_working_style IS NULL OR v.working_style = p_working_style);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_contacts_by_nlp(uuid, text, text, text) TO authenticated;

-- 3. Push Subscriptions and RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for public-facing tables
DROP POLICY IF EXISTS "Anon can view published forms" ON public.forms;
CREATE POLICY "Anon can view published forms" ON public.forms
    FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Anon can view published landing pages" ON public.landing_pages;
CREATE POLICY "Anon can view published landing pages" ON public.landing_pages
    FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Anon can view own csat surveys" ON public.csat_surveys;
CREATE POLICY "Anon can view own csat surveys" ON public.csat_surveys
    FOR SELECT TO anon, authenticated USING (public_token IS NOT NULL);

DROP POLICY IF EXISTS "Anon can view own document signatures" ON public.document_signatures;
CREATE POLICY "Anon can view own document signatures" ON public.document_signatures
    FOR SELECT TO anon, authenticated USING (signature_token IS NOT NULL);
