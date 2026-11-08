CREATE OR REPLACE FUNCTION public.get_interactions_by_salesperson(p_days integer DEFAULT 30)
 RETURNS TABLE(vendedor_id integer, vendedor_nome text, total_interacoes bigint, empresas_atendidas bigint, media_por_dia numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as vendedor_id,
    s.nome as vendedor_nome,
    COUNT(i.id) as total_interacoes,
    COUNT(DISTINCT i.company_id) as empresas_atendidas,
    ROUND(COUNT(i.id)::numeric / p_days, 2) as media_por_dia
  FROM salespeople s
  LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= now() - (p_days || ' days')::interval
  GROUP BY s.id, s.nome
  ORDER BY total_interacoes DESC;
END;
$function$
