CREATE OR REPLACE FUNCTION public.list_companies_paginated(p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, p_status text DEFAULT NULL::text, p_uf text DEFAULT NULL::text)
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
  -- Contar total
  SELECT COUNT(*) INTO total_count
  FROM companies
  WHERE deleted_at IS NULL
  AND (p_status IS NULL OR status::text = p_status)
  AND (p_uf IS NULL OR uf = p_uf);
  
  -- Buscar dados
  SELECT jsonb_build_object(
    'data', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT id, nome_crm, cnpj, email, telefone, cidade, uf, status, created_at
        FROM companies
        WHERE deleted_at IS NULL
        AND (p_status IS NULL OR status::text = p_status)
        AND (p_uf IS NULL OR uf = p_uf)
        ORDER BY nome_crm
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
