CREATE OR REPLACE FUNCTION public.list_interactions_paginated(p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, p_company_id uuid DEFAULT NULL::uuid, p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_count int;
  offset_val int := (p_page - 1) * p_page_size;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM interactions
  WHERE (p_company_id IS NULL OR company_id = p_company_id)
  AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id);
  
  SELECT jsonb_build_object(
    'data', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT i.id, i.tipo_interacao, i.canal, i.resumo_interacao, i.data_followup, i.followup_pendente,
               c.nome_crm as empresa, s.nome as vendedor, i.created_at
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        LEFT JOIN salespeople s ON s.id = i.usuario_responsavel_id
        WHERE (p_company_id IS NULL OR i.company_id = p_company_id)
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
        ORDER BY i.created_at DESC
        LIMIT p_page_size OFFSET offset_val
      ) t
    ),
    'pagination', jsonb_build_object(
      'page', p_page,
      'page_size', p_page_size,
      'total', total_count,
      'total_pages', CEIL(total_count::numeric / p_page_size)::int
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
