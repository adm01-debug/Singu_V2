CREATE OR REPLACE FUNCTION public.get_interaction_templates(p_type text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, name text, type text, subject text, content text, tags text[], is_public boolean, usage_count integer, owner_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.type,
    t.subject,
    t.content,
    t.tags,
    t.is_public,
    t.usage_count,
    p.full_name as owner_name
  FROM interaction_templates t
  LEFT JOIN profiles p ON p.id = t.user_id
  WHERE (t.is_public = true OR t.user_id = p_user_id)
    AND (p_type IS NULL OR t.type = p_type)
  ORDER BY t.usage_count DESC, t.name;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
