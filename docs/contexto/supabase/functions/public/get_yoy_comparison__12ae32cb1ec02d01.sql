CREATE OR REPLACE FUNCTION public.get_yoy_comparison()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  current_year_value numeric;
  last_year_value numeric;
BEGIN
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO current_year_value
  FROM customers WHERE ja_comprou = true AND EXTRACT(YEAR FROM updated_at) = EXTRACT(YEAR FROM now()) AND deleted_at IS NULL;
  
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO last_year_value
  FROM customers WHERE ja_comprou = true AND EXTRACT(YEAR FROM updated_at) = EXTRACT(YEAR FROM now()) - 1 AND deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'ano_atual', EXTRACT(YEAR FROM now())::int,
    'valor_ano_atual', current_year_value,
    'valor_ano_anterior', last_year_value,
    'variacao_percentual', ROUND((current_year_value - last_year_value) / NULLIF(last_year_value, 0) * 100, 2),
    'crescimento', CASE WHEN current_year_value > last_year_value THEN true ELSE false END
  ) INTO result;
  
  RETURN result;
END;
$function$
