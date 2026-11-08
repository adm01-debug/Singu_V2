CREATE OR REPLACE FUNCTION public.get_goals_status(p_vendedor_id integer DEFAULT NULL::integer, p_meta_interacoes_dia integer DEFAULT 10, p_meta_empresas_semana integer DEFAULT 20, p_meta_clientes_mes integer DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  interacoes_hoje int;
  empresas_semana int;
  clientes_mes int;
BEGIN
  -- Calcular métricas
  IF p_vendedor_id IS NOT NULL THEN
    SELECT COUNT(*) INTO interacoes_hoje FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at::date = CURRENT_DATE;
    SELECT COUNT(DISTINCT company_id) INTO empresas_semana FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_trunc('week', now());
    SELECT COUNT(*) INTO clientes_mes FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL;
  ELSE
    SELECT COUNT(*) INTO interacoes_hoje FROM interactions WHERE created_at::date = CURRENT_DATE;
    SELECT COUNT(DISTINCT company_id) INTO empresas_semana FROM interactions WHERE created_at >= date_trunc('week', now());
    SELECT COUNT(*) INTO clientes_mes FROM customers WHERE cliente_ativado = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL;
  END IF;
  
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'metas', jsonb_build_object(
      'interacoes_dia', jsonb_build_object(
        'meta', p_meta_interacoes_dia,
        'realizado', interacoes_hoje,
        'percentual', ROUND(interacoes_hoje::numeric / NULLIF(p_meta_interacoes_dia, 0) * 100, 2),
        'status', CASE WHEN interacoes_hoje >= p_meta_interacoes_dia THEN 'atingida' ELSE 'em_andamento' END
      ),
      'empresas_semana', jsonb_build_object(
        'meta', p_meta_empresas_semana,
        'realizado', empresas_semana,
        'percentual', ROUND(empresas_semana::numeric / NULLIF(p_meta_empresas_semana, 0) * 100, 2),
        'status', CASE WHEN empresas_semana >= p_meta_empresas_semana THEN 'atingida' ELSE 'em_andamento' END
      ),
      'clientes_mes', jsonb_build_object(
        'meta', p_meta_clientes_mes,
        'realizado', clientes_mes,
        'percentual', ROUND(clientes_mes::numeric / NULLIF(p_meta_clientes_mes, 0) * 100, 2),
        'status', CASE WHEN clientes_mes >= p_meta_clientes_mes THEN 'atingida' ELSE 'em_andamento' END
      )
    ),
    'score_geral', ROUND(
      (interacoes_hoje::numeric / NULLIF(p_meta_interacoes_dia, 0) * 33.33 +
       empresas_semana::numeric / NULLIF(p_meta_empresas_semana, 0) * 33.33 +
       clientes_mes::numeric / NULLIF(p_meta_clientes_mes, 0) * 33.34), 2
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
