CREATE OR REPLACE FUNCTION public.seed_lead_score_defaults(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.lead_score_thresholds (user_id, grade, min_score) VALUES
    (_user_id, 'A', 80),
    (_user_id, 'B', 60),
    (_user_id, 'C', 40),
    (_user_id, 'D', 0)
  ON CONFLICT (user_id, grade) DO NOTHING;

  INSERT INTO public.lead_score_rules (user_id, dimension, signal_key, weight, decay_days) VALUES
    (_user_id, 'fit', 'company_present', 10, 365),
    (_user_id, 'fit', 'role_present', 8, 365),
    (_user_id, 'fit', 'email_present', 5, 365),
    (_user_id, 'fit', 'phone_present', 5, 365),
    (_user_id, 'engagement', 'interaction', 3, 30),
    (_user_id, 'engagement', 'recent_interaction_7d', 10, 14),
    (_user_id, 'engagement', 'email_open', 2, 14),
    (_user_id, 'engagement', 'email_click', 5, 14),
    (_user_id, 'engagement', 'email_reply', 12, 30),
    (_user_id, 'engagement', 'sequence_completed', 8, 30),
    (_user_id, 'intent', 'page_view', 2, 14),
    (_user_id, 'intent', 'pricing_view', 8, 14),
    (_user_id, 'intent', 'demo_request', 15, 30),
    (_user_id, 'intent', 'form_submit', 10, 21),
    (_user_id, 'intent', 'email_click', 4, 14),
    (_user_id, 'intent', 'content_download', 6, 21),
    (_user_id, 'relationship', 'relationship_score', 1, 60)
  ON CONFLICT (user_id, dimension, signal_key) DO NOTHING;
END;
$function$
