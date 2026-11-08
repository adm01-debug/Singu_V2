CREATE OR REPLACE FUNCTION public.get_message_templates(p_type text DEFAULT NULL::text)
 RETURNS TABLE(template_id uuid, name text, content text, template_type text, usage_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, name, content, type, COALESCE(usage_count, 0)
  FROM interaction_templates
  WHERE is_public = true AND (p_type IS NULL OR type = p_type)
  ORDER BY usage_count DESC;
$function$
