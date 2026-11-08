CREATE OR REPLACE FUNCTION public.get_deals_forecast(p_user_id uuid DEFAULT NULL::uuid, p_months integer DEFAULT 3)
 RETURNS TABLE(month_year text, expected_value numeric, deal_count bigint, weighted_value numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    TO_CHAR(d.previsao_fechamento, 'YYYY-MM') as month_year,
    SUM(d.valor)::numeric as expected_value,
    COUNT(*)::bigint as deal_count,
    SUM(d.valor * d.probabilidade / 100)::numeric as weighted_value
  FROM deals d
  WHERE d.status NOT IN ('ganho', 'perdido', 'arquivado')
    AND d.previsao_fechamento IS NOT NULL
    AND d.previsao_fechamento <= CURRENT_DATE + (p_months || ' months')::interval
    AND (p_user_id IS NULL OR d.user_id = p_user_id)
  GROUP BY TO_CHAR(d.previsao_fechamento, 'YYYY-MM')
  ORDER BY month_year;
END;
$function$
