CREATE OR REPLACE FUNCTION public.get_retention_rate(p_months integer DEFAULT 12)
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
    'clientes_inicio', (
      SELECT COUNT(*) FROM customers
      WHERE cliente_ativado = true AND created_at < now() - (p_months || ' months')::interval AND deleted_at IS NULL
    ),
    'clientes_ativos_ainda', (
      SELECT COUNT(*) FROM customers cu
      WHERE cu.cliente_ativado = true AND cu.created_at < now() - (p_months || ' months')::interval AND cu.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '90 days')
    ),
    'taxa_retencao', ROUND(
      (SELECT COUNT(*) FROM customers cu
       WHERE cu.cliente_ativado = true AND cu.created_at < now() - (p_months || ' months')::interval AND cu.deleted_at IS NULL
       AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '90 days'))::numeric /
      NULLIF((SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND created_at < now() - (p_months || ' months')::interval AND deleted_at IS NULL), 0) * 100, 2
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
