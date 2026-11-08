CREATE OR REPLACE FUNCTION public.get_entity_documents(p_entity_type text, p_entity_id uuid)
 RETURNS TABLE(id uuid, file_name text, file_url text, file_type text, file_size integer, description text, uploaded_by text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.file_name,
    d.file_url,
    d.file_type,
    d.file_size,
    d.description,
    p.full_name as uploaded_by,
    d.created_at
  FROM documents d
  LEFT JOIN profiles p ON p.id = d.user_id
  WHERE d.entity_type = p_entity_type AND d.entity_id = p_entity_id
  ORDER BY d.created_at DESC;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
