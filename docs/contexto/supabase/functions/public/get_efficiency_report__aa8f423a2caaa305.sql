CREATE OR REPLACE FUNCTION public.get_efficiency_report(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  start_date timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'metricas_globais', jsonb_build_object(
      'empresas_criadas', (SELECT COUNT(*) FROM companies WHERE created_at >= start_date AND deleted_at IS NULL),
      'contatos_criados', (SELECT COUNT(*) FROM contacts WHERE created_at >= start_date AND deleted_at IS NULL),
      'interacoes_realizadas', (SELECT COUNT(*) FROM interactions WHERE created_at >= start_date),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= start_date AND deleted_at IS NULL),
      'clientes_compradores', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND updated_at >= start_date AND deleted_at IS NULL)
    ),
    'taxas_conversao', jsonb_build_object(
      'empresa_para_contato', ROUND(
        (SELECT COUNT(DISTINCT company_id) FROM contacts WHERE created_at >= start_date AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE created_at >= start_date AND deleted_at IS NULL), 0) * 100, 2
      ),
      'contato_para_interacao', ROUND(
        (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= start_date)::numeric /
        NULLIF((SELECT COUNT(DISTINCT company_id) FROM contacts WHERE created_at >= start_date AND deleted_at IS NULL), 0) * 100, 2
      ),
      'interacao_para_cliente', ROUND(
        (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= start_date AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= start_date), 0) * 100, 2
      ),
      'cliente_para_compra', ROUND(
        (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND updated_at >= start_date AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= start_date AND deleted_at IS NULL), 0) * 100, 2
      )
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.taxa_conversao DESC NULLS LAST)
      FROM (
        SELECT 
          s.nome as vendedor,
          (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) as interacoes,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= start_date AND deleted_at IS NULL) as ativados,
          ROUND(
            (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= start_date AND deleted_at IS NULL)::numeric /
            NULLIF((SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date), 0) * 100, 2
          ) as taxa_conversao
        FROM salespeople s
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
