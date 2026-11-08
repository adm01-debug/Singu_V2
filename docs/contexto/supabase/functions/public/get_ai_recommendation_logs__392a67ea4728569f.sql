CREATE OR REPLACE FUNCTION public.get_ai_recommendation_logs(p_limit integer DEFAULT 50)
 RETURNS SETOF ai_recommendation_audit_logs
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT * FROM ai_recommendation_audit_logs
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT p_limit;
$function$
