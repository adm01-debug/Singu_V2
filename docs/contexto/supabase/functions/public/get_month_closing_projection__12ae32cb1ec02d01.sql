CREATE OR REPLACE FUNCTION public.get_month_closing_projection()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  dias_passados int;
  dias_mes int;
  valor_atual numeric;
  taxa_diaria numeric;
BEGIN
  dias_passados := EXTRACT(DAY FROM now())::int;
  dias_mes := EXTRACT(DAY FROM (date_trunc('month', now()) + interval '1 month' - interval '1 day'))::int;
  
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO valor_atual
  FROM customers WHERE ja_comprou = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL;
  
  taxa_diaria := valor_atual / NULLIF(dias_passados, 0);
  
  SELECT jsonb_build_object(
    'mes_atual', TO_CHAR(now(), 'Month YYYY'),
    'dias_passados', dias_passados,
    'dias_restantes', dias_mes - dias_passados,
    'valor_realizado', ROUND(valor_atual, 2),
    'taxa_diaria', ROUND(taxa_diaria, 2),
    'projecao_final', ROUND(taxa_diaria * dias_mes, 2),
    'empresas_no_mes', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('month', now()) AND deleted_at IS NULL),
    'clientes_no_mes', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL)
  ) INTO result;
  
  RETURN result;
END;
$function$
