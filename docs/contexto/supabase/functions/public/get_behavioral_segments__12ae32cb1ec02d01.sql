CREATE OR REPLACE FUNCTION public.get_behavioral_segments()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'segmentos', jsonb_build_object(
      'compradores_frequentes', (
        SELECT COUNT(*) FROM customers WHERE total_pedidos >= 3 AND deleted_at IS NULL
      ),
      'alto_valor', (
        SELECT COUNT(*) FROM customers WHERE valor_total_compras >= 50000 AND deleted_at IS NULL
      ),
      'novos_promissores', (
        SELECT COUNT(*) FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
        AND c.created_at >= now() - interval '30 days'
        AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id)
      ),
      'inativos_valiosos', (
        SELECT COUNT(*) FROM customers cu
        WHERE cu.valor_total_compras >= 10000 AND cu.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '60 days')
      ),
      'potenciais_upsell', (
        SELECT COUNT(*) FROM customers
        WHERE cliente_ativado = true AND ja_comprou = true AND valor_total_compras < 20000 AND total_pedidos = 1 AND deleted_at IS NULL
      )
    ),
    'acoes_sugeridas', jsonb_build_object(
      'reativar_inativos', 'Contatar clientes valiosos sem interação recente',
      'upsell_compradores', 'Ofertar upgrades para compradores de primeira vez',
      'fidelizar_frequentes', 'Programa de fidelidade para compradores frequentes'
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
