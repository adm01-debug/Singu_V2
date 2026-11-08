CREATE OR REPLACE FUNCTION public.get_full_performance_report(p_start_date date DEFAULT (date_trunc('month'::text, now()))::date, p_end_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_start_date, 'fim', p_end_date),
    'resumo', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL),
      'contatos_novos', (SELECT COUNT(*) FROM contacts WHERE created_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN p_start_date AND p_end_date),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL),
      'conversoes', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL),
      'valor_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.valor_vendas DESC NULLS LAST)
      FROM (
        SELECT 
          s.nome,
          COUNT(DISTINCT i.id) as interacoes,
          COUNT(DISTINCT i.company_id) as empresas_atendidas,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND ja_comprou = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL) as conversoes,
          (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = s.id AND ja_comprou = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL) as valor_vendas
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at::date BETWEEN p_start_date AND p_end_date
        GROUP BY s.id, s.nome
      ) t
    ),
    'alertas', jsonb_build_object(
      'criados', (SELECT COUNT(*) FROM alerts WHERE created_at::date BETWEEN p_start_date AND p_end_date),
      'resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at::date BETWEEN p_start_date AND p_end_date)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
