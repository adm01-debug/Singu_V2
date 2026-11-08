CREATE OR REPLACE FUNCTION public.get_response_rate_by_salesperson(p_days integer DEFAULT 30)
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
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.taxa_resposta DESC NULLS LAST)
      FROM (
        SELECT 
          s.id,
          s.nome,
          COUNT(DISTINCT i.company_id) as empresas_contatadas,
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.cliente_ativado = true) as convertidas,
          ROUND(
            COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.cliente_ativado = true)::numeric / 
            NULLIF(COUNT(DISTINCT i.company_id), 0) * 100, 2
          ) as taxa_resposta,
          COUNT(i.id) as total_interacoes
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= now() - (p_days || ' days')::interval
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
      ) t
    ),
    'media_geral', (
      SELECT ROUND(AVG(taxa), 2)
      FROM (
        SELECT 
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.cliente_ativado = true)::numeric / 
          NULLIF(COUNT(DISTINCT i.company_id), 0) * 100 as taxa
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= now() - (p_days || ' days')::interval
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.deleted_at IS NULL
        GROUP BY s.id
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
