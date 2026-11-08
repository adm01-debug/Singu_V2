CREATE OR REPLACE FUNCTION public.get_simulated_nps()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  promotores int := 0;
  neutros int := 0;
  detratores int := 0;
  total int;
BEGIN
  -- Promotores: clientes ativos com interações recentes e compras
  SELECT COUNT(*) INTO promotores FROM customers cu
  WHERE cu.cliente_ativado = true AND cu.ja_comprou = true AND cu.deleted_at IS NULL
  AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '30 days');
  
  -- Neutros: clientes ativos sem interações recentes
  SELECT COUNT(*) INTO neutros FROM customers cu
  WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '30 days')
  AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '90 days');
  
  -- Detratores: clientes sem interação há 90+ dias
  SELECT COUNT(*) INTO detratores FROM customers cu
  WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '90 days');
  
  total := promotores + neutros + detratores;
  
  SELECT jsonb_build_object(
    'timestamp', now(),
    'nps_score', CASE WHEN total > 0 THEN ROUND((promotores - detratores)::numeric / total * 100, 0) ELSE 0 END,
    'distribuicao', jsonb_build_object(
      'promotores', promotores,
      'neutros', neutros,
      'detratores', detratores,
      'total', total
    ),
    'percentuais', jsonb_build_object(
      'promotores', ROUND(promotores::numeric / NULLIF(total, 0) * 100, 2),
      'neutros', ROUND(neutros::numeric / NULLIF(total, 0) * 100, 2),
      'detratores', ROUND(detratores::numeric / NULLIF(total, 0) * 100, 2)
    ),
    'metodologia', 'NPS simulado baseado em engajamento (interações recentes)'
  ) INTO result;
  
  RETURN result;
END;
$function$
