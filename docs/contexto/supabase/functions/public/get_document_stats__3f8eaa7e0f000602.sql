CREATE OR REPLACE FUNCTION public.get_document_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'by_type', (
        SELECT COALESCE(jsonb_object_agg(file_type, cnt), '{}'::jsonb)
        FROM (SELECT file_type, COUNT(*) as cnt FROM documents WHERE p_user_id IS NULL OR user_id = p_user_id GROUP BY file_type) t
      ),
      'by_entity', (
        SELECT COALESCE(jsonb_object_agg(entity_type, cnt), '{}'::jsonb)
        FROM (SELECT entity_type, COUNT(*) as cnt FROM documents WHERE p_user_id IS NULL OR user_id = p_user_id GROUP BY entity_type) t
      ),
      'total_size_mb', ROUND(COALESCE(SUM(file_size), 0)::numeric / 1024 / 1024, 2)
    )
    FROM documents
    WHERE p_user_id IS NULL OR user_id = p_user_id
  );
EXCEPTION WHEN undefined_table THEN
  RETURN jsonb_build_object('total', 0);
END;
$function$
