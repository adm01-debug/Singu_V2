CREATE OR REPLACE FUNCTION public.get_funnel_leakage_analysis(p_days integer DEFAULT 90)
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
    'empresas_sem_contato', (
      SELECT COUNT(*) FROM companies c
      WHERE c.created_at >= now() - (p_days || ' days')::interval AND c.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)
    ),
    'contatos_sem_ativacao', (
      SELECT COUNT(DISTINCT i.company_id) FROM interactions i
      WHERE i.created_at >= now() - (p_days || ' days')::interval
      AND NOT EXISTS (SELECT 1 FROM customers cu WHERE cu.company_id = i.company_id AND cu.cliente_ativado = true AND cu.deleted_at IS NULL)
    ),
    'ativados_sem_compra', (
      SELECT COUNT(*) FROM customers cu
      WHERE cu.cliente_ativado = true AND cu.ja_comprou = false AND cu.deleted_at IS NULL
    ),
    'empresas_inativas_30d', (
      SELECT COUNT(*) FROM companies c
      WHERE c.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - interval '30 days')
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
