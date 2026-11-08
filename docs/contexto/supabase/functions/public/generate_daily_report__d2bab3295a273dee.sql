CREATE OR REPLACE FUNCTION public.generate_daily_report(p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'data', p_date,
    'gerado_em', now(),
    'resumo', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at::date = p_date AND deleted_at IS NULL),
      'contatos_novos', (SELECT COUNT(*) FROM contacts WHERE created_at::date = p_date AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date = p_date),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at::date = p_date AND deleted_at IS NULL),
      'alertas_criados', (SELECT COUNT(*) FROM alerts WHERE created_at::date = p_date),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at::date = p_date)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.interacoes DESC)
      FROM (
        SELECT 
          s.nome,
          COUNT(i.id) as interacoes,
          COUNT(DISTINCT i.company_id) as empresas_atendidas
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at::date = p_date
        GROUP BY s.id, s.nome
        HAVING COUNT(i.id) > 0
      ) t
    ),
    'por_tipo_interacao', (
      SELECT jsonb_object_agg(COALESCE(tipo_interacao, 'outros'), cnt)
      FROM (SELECT tipo_interacao, COUNT(*) as cnt FROM interactions WHERE created_at::date = p_date GROUP BY tipo_interacao) t
    ),
    'empresas_criadas', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (SELECT id, nome_crm, cidade, uf FROM companies WHERE created_at::date = p_date AND deleted_at IS NULL LIMIT 10) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
