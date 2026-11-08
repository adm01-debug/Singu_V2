CREATE OR REPLACE FUNCTION public.get_email_templates_by_stage(p_stage text DEFAULT NULL::text)
 RETURNS TABLE(template_id uuid, template_name text, stage text, subject text, usage_count integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as template_id,
    t.name::text as template_name,
    COALESCE(t.category, 'geral')::text as stage,
    COALESCE(t.subject, t.name)::text as subject,
    COALESCE(t.usage_count, 0)::int as usage_count
  FROM interaction_templates t
  WHERE t.deleted_at IS NULL AND t.type = 'email'
    AND (p_stage IS NULL OR t.category = p_stage)
  ORDER BY usage_count DESC;
END;
$function$
