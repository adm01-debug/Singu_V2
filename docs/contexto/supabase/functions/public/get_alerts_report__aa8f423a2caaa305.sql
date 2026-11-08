CREATE OR REPLACE FUNCTION public.get_alerts_report(p_days integer DEFAULT 30)
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
    'resumo', jsonb_build_object(
      'criados', (SELECT COUNT(*) FROM alerts WHERE created_at >= now() - (p_days || ' days')::interval),
      'resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at >= now() - (p_days || ' days')::interval),
      'pendentes', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL)
    ),
    'por_prioridade', (
      SELECT jsonb_object_agg(COALESCE(prioridade, 'normal'), cnt)
      FROM (SELECT prioridade, COUNT(*) as cnt FROM alerts WHERE resolved_at IS NULL GROUP BY prioridade) t
    ),
    'por_tipo', (
      SELECT jsonb_object_agg(COALESCE(tipo, 'outro'), cnt)
      FROM (SELECT tipo, COUNT(*) as cnt FROM alerts WHERE resolved_at IS NULL GROUP BY tipo) t
    ),
    'recentes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT a.id, a.tipo, a.mensagem, a.prioridade, c.nome_crm, a.created_at
        FROM alerts a
        JOIN companies c ON c.id = a.company_id
        WHERE a.resolved_at IS NULL
        ORDER BY a.created_at DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
