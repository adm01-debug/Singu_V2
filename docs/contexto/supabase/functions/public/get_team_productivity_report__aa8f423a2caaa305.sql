CREATE OR REPLACE FUNCTION public.get_team_productivity_report(p_days integer DEFAULT 30)
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
    'data_inicio', start_date,
    'resumo_equipe', jsonb_build_object(
      'total_vendedores', (SELECT COUNT(*) FROM salespeople),
      'total_interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= start_date),
      'media_interacoes_vendedor', (
        SELECT ROUND(AVG(cnt), 2) FROM (
          SELECT COUNT(*) as cnt FROM interactions WHERE created_at >= start_date GROUP BY usuario_responsavel_id
        ) t
      ),
      'total_clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= start_date AND deleted_at IS NULL)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.interacoes DESC)
      FROM (
        SELECT 
          s.id as vendedor_id,
          s.nome as vendedor_nome,
          (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) as interacoes,
          (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) as empresas_contatadas,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= start_date AND deleted_at IS NULL) as clientes_ativados,
          CASE 
            WHEN (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) > p_days * 3 THEN 'acima_meta'
            WHEN (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) > p_days THEN 'na_meta'
            ELSE 'abaixo_meta'
          END as status_meta
        FROM salespeople s
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
