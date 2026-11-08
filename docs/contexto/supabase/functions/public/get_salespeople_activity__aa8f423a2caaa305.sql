CREATE OR REPLACE FUNCTION public.get_salespeople_activity(p_days integer DEFAULT 7)
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
    'vendedores', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          s.id as vendedor_id,
          s.nome as vendedor_nome,
          (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) as interacoes,
          (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) as empresas_contatadas,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= start_date) as clientes_ativados,
          CASE 
            WHEN (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) > p_days * 5 THEN 'alta'
            WHEN (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= start_date) > p_days * 2 THEN 'media'
            ELSE 'baixa'
          END as nivel_atividade
        FROM salespeople s
        ORDER BY interacoes DESC
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
