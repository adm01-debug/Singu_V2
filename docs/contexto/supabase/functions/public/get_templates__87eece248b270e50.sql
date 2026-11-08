CREATE OR REPLACE FUNCTION public.get_templates(p_channel text DEFAULT NULL::text, p_category text DEFAULT NULL::text)
 RETURNS TABLE(template_id uuid, name text, channel text, category text, subject text, body text, variables text[], use_count integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name::text, t.channel::text, t.category::text, t.subject::text, t.body::text, t.variables, t.use_count
  FROM message_templates t
  WHERE t.is_active = true
    AND (p_channel IS NULL OR t.channel = p_channel)
    AND (p_category IS NULL OR t.category = p_category)
  ORDER BY t.use_count DESC, t.name;
END;
$function$
