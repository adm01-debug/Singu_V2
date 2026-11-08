CREATE OR REPLACE FUNCTION public.search_quick_notes(p_search_term text, p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(note_id uuid, company_id uuid, company_name text, content text, note_type text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    n.id as note_id,
    n.company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name,
    n.content,
    n.note_type,
    n.created_at
  FROM quick_notes n
  JOIN companies c ON c.id = n.company_id
  WHERE n.content ILIKE '%' || p_search_term || '%'
    AND COALESCE(n.is_archived, false) = false
    AND (p_user_id IS NULL OR n.user_id = p_user_id)
  ORDER BY n.created_at DESC
  LIMIT p_limit;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
