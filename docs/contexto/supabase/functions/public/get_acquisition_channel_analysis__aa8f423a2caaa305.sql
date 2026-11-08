CREATE OR REPLACE FUNCTION public.get_acquisition_channel_analysis(p_days integer DEFAULT 90)
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
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(c.origem_lead, 'Não informada') as origem,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM customers cu WHERE cu.company_id = c.id AND cu.ja_comprou = true AND cu.deleted_at IS NULL)) as convertidos,
          COALESCE(SUM((SELECT valor_total_compras FROM customers cu WHERE cu.company_id = c.id AND cu.deleted_at IS NULL LIMIT 1)), 0) as valor
        FROM companies c
        WHERE c.created_at >= now() - (p_days || ' days')::interval AND c.deleted_at IS NULL
        GROUP BY c.origem_lead
      ) t
    ),
    'melhor_canal', (
      SELECT c.origem_lead FROM companies c
      JOIN customers cu ON cu.company_id = c.id AND cu.ja_comprou = true AND cu.deleted_at IS NULL
      WHERE c.created_at >= now() - (p_days || ' days')::interval AND c.deleted_at IS NULL
      GROUP BY c.origem_lead
      ORDER BY SUM(cu.valor_total_compras) DESC NULLS LAST
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
