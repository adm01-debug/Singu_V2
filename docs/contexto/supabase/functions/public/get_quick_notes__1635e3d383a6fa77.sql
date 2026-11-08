CREATE OR REPLACE FUNCTION public.get_quick_notes(p_company_id uuid, p_include_archived boolean DEFAULT false)
 RETURNS TABLE(id uuid, content text, note_type text, is_pinned boolean, author_name text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.content,
    n.note_type,
    n.is_pinned,
    p.full_name as author_name,
    n.created_at,
    n.updated_at
  FROM quick_notes n
  LEFT JOIN profiles p ON p.id = n.user_id
  WHERE n.company_id = p_company_id
    AND (p_include_archived OR COALESCE(n.is_archived, false) = false)
  ORDER BY n.is_pinned DESC, n.created_at DESC;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
