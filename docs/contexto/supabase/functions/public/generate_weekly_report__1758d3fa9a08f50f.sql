CREATE OR REPLACE FUNCTION public.generate_weekly_report(p_week_start date DEFAULT (date_trunc('week'::text, now()))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  week_end date := p_week_start + interval '6 days';
BEGIN
  SELECT jsonb_build_object(
    'semana', jsonb_build_object('inicio', p_week_start, 'fim', week_end),
    'gerado_em', now(),
    'totais', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN p_week_start AND week_end AND deleted_at IS NULL),
      'contatos_novos', (SELECT COUNT(*) FROM contacts WHERE created_at::date BETWEEN p_week_start AND week_end AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN p_week_start AND week_end),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at::date BETWEEN p_week_start AND week_end AND deleted_at IS NULL)
    ),
    'evolucao_diaria', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia)
      FROM (
        SELECT 
          d::date as dia,
          (SELECT COUNT(*) FROM companies WHERE created_at::date = d::date AND deleted_at IS NULL) as empresas,
          (SELECT COUNT(*) FROM interactions WHERE created_at::date = d::date) as interacoes
        FROM generate_series(p_week_start, week_end, '1 day') d
      ) t
    ),
    'ranking_vendedores', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.interacoes DESC)
      FROM (
        SELECT 
          s.nome,
          COUNT(i.id) as interacoes,
          COUNT(DISTINCT i.company_id) as empresas
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at::date BETWEEN p_week_start AND week_end
        GROUP BY s.id, s.nome
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
