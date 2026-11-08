CREATE OR REPLACE FUNCTION public.get_conversion_by_origin(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'por_origem', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.taxa_conversao DESC NULLS LAST)
      FROM (
        SELECT 
          COALESCE(c.origem_lead, 'Não informada') as origem,
          COUNT(DISTINCT c.id) as total_leads,
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.cliente_ativado = true) as ativados,
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.ja_comprou = true) as convertidos,
          ROUND(COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.ja_comprou = true)::numeric / NULLIF(COUNT(DISTINCT c.id), 0) * 100, 2) as taxa_conversao
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.created_at >= now() - (p_days || ' days')::interval AND c.deleted_at IS NULL
        GROUP BY c.origem_lead
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
