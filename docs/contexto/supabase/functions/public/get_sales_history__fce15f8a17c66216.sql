CREATE OR REPLACE FUNCTION public.get_sales_history(p_months integer DEFAULT 12)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_meses', p_months,
    'historico', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', updated_at)::date as mes,
          COUNT(*) as clientes,
          COALESCE(SUM(valor_total_compras), 0) as valor,
          ROUND(COALESCE(AVG(ticket_medio), 0), 2) as ticket_medio
        FROM customers
        WHERE ja_comprou = true
        AND updated_at >= now() - (p_months || ' months')::interval
        AND deleted_at IS NULL
        GROUP BY date_trunc('month', updated_at)
      ) t
    ),
    'totais', jsonb_build_object(
      'total_clientes', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND updated_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
