CREATE OR REPLACE FUNCTION public.get_recent_changes(p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.data_alteracao DESC)
  INTO result
  FROM (
    SELECT * FROM (
      SELECT 'empresa' as tipo, id, nome_crm as nome, updated_at as data_alteracao
      FROM companies WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 20
    ) e
    UNION ALL
    SELECT * FROM (
      SELECT 'contato' as tipo, id, full_name as nome, updated_at as data_alteracao
      FROM contacts WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 20
    ) c
    UNION ALL
    SELECT * FROM (
      SELECT 'interacao' as tipo, id, tipo_interacao as nome, created_at as data_alteracao
      FROM interactions ORDER BY created_at DESC LIMIT 20
    ) i
  ) t
  ORDER BY t.data_alteracao DESC
  LIMIT p_limit;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
