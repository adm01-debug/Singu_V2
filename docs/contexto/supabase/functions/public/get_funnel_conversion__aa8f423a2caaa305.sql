CREATE OR REPLACE FUNCTION public.get_funnel_conversion(p_days integer DEFAULT 30)
 RETURNS TABLE(from_stage text, to_stage text, conversions bigint, conversion_rate numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Análise simplificada baseada em interações de mudança de status
  RETURN QUERY
  SELECT 
    COALESCE(SPLIT_PART(i.resumo, ' para ', 1), 'desconhecido')::text as from_stage,
    COALESCE(SPLIT_PART(i.resumo, ' para ', 2), 'desconhecido')::text as to_stage,
    COUNT(*)::bigint as conversions,
    100.0::numeric as conversion_rate
  FROM interactions i
  WHERE i.type = 'system' 
    AND i.resumo LIKE 'Status alterado%'
    AND i.data_interacao >= NOW() - (p_days || ' days')::interval
  GROUP BY SPLIT_PART(i.resumo, ' para ', 1), SPLIT_PART(i.resumo, ' para ', 2)
  ORDER BY conversions DESC
  LIMIT 20;
END;
$function$
