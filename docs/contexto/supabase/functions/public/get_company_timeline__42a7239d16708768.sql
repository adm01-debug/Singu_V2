CREATE OR REPLACE FUNCTION public.get_company_timeline(p_company_id uuid, p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.data DESC)
  INTO result
  FROM (
    SELECT 'interacao' as tipo, id, type as subtipo, resumo as descricao, created_at as data
    FROM interactions WHERE company_id = p_company_id
    UNION ALL
    SELECT 'alerta' as tipo, id, type as subtipo, message as descricao, created_at as data
    FROM alerts WHERE company_id = p_company_id
    UNION ALL
    SELECT 'contato_criado' as tipo, id, 'novo_contato' as subtipo, full_name as descricao, created_at as data
    FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL
    ORDER BY data DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
