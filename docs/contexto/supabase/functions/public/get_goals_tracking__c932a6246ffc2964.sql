CREATE OR REPLACE FUNCTION public.get_goals_tracking(p_meta_interacoes_dia integer DEFAULT 5, p_meta_clientes_mes integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  today_start timestamptz := date_trunc('day', now());
  month_start timestamptz := date_trunc('month', now());
BEGIN
  SELECT jsonb_build_object(
    'metas', jsonb_build_object(
      'interacoes_dia', p_meta_interacoes_dia,
      'clientes_mes', p_meta_clientes_mes
    ),
    'equipe', jsonb_build_object(
      'interacoes_hoje', (SELECT COUNT(*) FROM interactions WHERE created_at >= today_start),
      'meta_diaria_pct', ROUND((SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= today_start) / (p_meta_interacoes_dia * (SELECT COUNT(*) FROM salespeople)) * 100, 2),
      'clientes_ativados_mes', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= month_start AND deleted_at IS NULL),
      'meta_mensal_pct', ROUND((SELECT COUNT(*)::numeric FROM customers WHERE cliente_ativado = true AND updated_at >= month_start AND deleted_at IS NULL) / (p_meta_clientes_mes * (SELECT COUNT(*) FROM salespeople)) * 100, 2)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.meta_diaria_pct DESC)
      FROM (
        SELECT 
          s.id as vendedor_id,
          s.nome as vendedor_nome,
          (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= today_start) as interacoes_hoje,
          ROUND((SELECT COUNT(*)::numeric FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= today_start) / p_meta_interacoes_dia * 100, 2) as meta_diaria_pct,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= month_start AND deleted_at IS NULL) as clientes_mes,
          ROUND((SELECT COUNT(*)::numeric FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= month_start AND deleted_at IS NULL) / p_meta_clientes_mes * 100, 2) as meta_mensal_pct
        FROM salespeople s
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
