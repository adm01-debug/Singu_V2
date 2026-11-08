CREATE OR REPLACE FUNCTION public.get_monthly_performance_report(p_month date DEFAULT (date_trunc('month'::text, now()))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_start_date date;
  v_end_date date;
BEGIN
  v_start_date := p_month;
  v_end_date := (p_month + interval '1 month')::date;
  
  SELECT jsonb_build_object(
    'mes', to_char(p_month, 'YYYY-MM'),
    'kpis', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at >= v_start_date AND created_at < v_end_date AND deleted_at IS NULL),
      'contatos_novos', (SELECT COUNT(*) FROM contacts WHERE created_at >= v_start_date AND created_at < v_end_date AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= v_start_date AND created_at < v_end_date),
      'alertas_criados', (SELECT COUNT(*) FROM alerts WHERE created_at >= v_start_date AND created_at < v_end_date),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at >= v_start_date AND resolved_at < v_end_date)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.interacoes DESC)
      FROM (
        SELECT 
          s.nome,
          COUNT(i.id) as interacoes,
          COUNT(DISTINCT i.company_id) as empresas_atendidas
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= v_start_date AND i.created_at < v_end_date
        GROUP BY s.id, s.nome
      ) t
    ),
    'por_canal', (
      SELECT jsonb_object_agg(COALESCE(canal, 'Não informado'), cnt)
      FROM (
        SELECT canal, COUNT(*) as cnt FROM interactions 
        WHERE created_at >= v_start_date AND created_at < v_end_date
        GROUP BY canal
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
