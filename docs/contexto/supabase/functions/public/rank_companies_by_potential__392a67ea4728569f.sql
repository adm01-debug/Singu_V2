CREATE OR REPLACE FUNCTION public.rank_companies_by_potential(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, score integer, potencial text, interacoes_recentes bigint, valor_historico numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH company_scores AS (
    SELECT 
      c.id,
      c.nome_crm,
      COALESCE((SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id), 0) as interacoes,
      COALESCE((SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - interval '30 days'), 0) as interacoes_recentes,
      COALESCE(cu.valor_total_compras, 0) as valor,
      CASE WHEN EXISTS(SELECT 1 FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL) THEN true ELSE false END as tem_contato
    FROM companies c
    LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
  )
  SELECT 
    cs.id as company_id,
    cs.nome_crm,
    (CASE WHEN cs.interacoes > 5 THEN 30 WHEN cs.interacoes > 2 THEN 20 WHEN cs.interacoes > 0 THEN 10 ELSE 0 END +
     CASE WHEN cs.interacoes_recentes > 2 THEN 30 WHEN cs.interacoes_recentes > 0 THEN 20 ELSE 0 END +
     CASE WHEN cs.tem_contato THEN 20 ELSE 0 END +
     CASE WHEN cs.valor > 0 THEN 20 ELSE 0 END)::int as score,
    CASE 
      WHEN (CASE WHEN cs.interacoes > 5 THEN 30 WHEN cs.interacoes > 2 THEN 20 WHEN cs.interacoes > 0 THEN 10 ELSE 0 END +
            CASE WHEN cs.interacoes_recentes > 2 THEN 30 WHEN cs.interacoes_recentes > 0 THEN 20 ELSE 0 END +
            CASE WHEN cs.tem_contato THEN 20 ELSE 0 END +
            CASE WHEN cs.valor > 0 THEN 20 ELSE 0 END) >= 80 THEN 'muito_alto'
      WHEN (CASE WHEN cs.interacoes > 5 THEN 30 WHEN cs.interacoes > 2 THEN 20 WHEN cs.interacoes > 0 THEN 10 ELSE 0 END +
            CASE WHEN cs.interacoes_recentes > 2 THEN 30 WHEN cs.interacoes_recentes > 0 THEN 20 ELSE 0 END +
            CASE WHEN cs.tem_contato THEN 20 ELSE 0 END +
            CASE WHEN cs.valor > 0 THEN 20 ELSE 0 END) >= 60 THEN 'alto'
      WHEN (CASE WHEN cs.interacoes > 5 THEN 30 WHEN cs.interacoes > 2 THEN 20 WHEN cs.interacoes > 0 THEN 10 ELSE 0 END +
            CASE WHEN cs.interacoes_recentes > 2 THEN 30 WHEN cs.interacoes_recentes > 0 THEN 20 ELSE 0 END +
            CASE WHEN cs.tem_contato THEN 20 ELSE 0 END +
            CASE WHEN cs.valor > 0 THEN 20 ELSE 0 END) >= 40 THEN 'medio'
      ELSE 'baixo'
    END as potencial,
    cs.interacoes_recentes,
    cs.valor as valor_historico
  FROM company_scores cs
  ORDER BY score DESC
  LIMIT p_limit;
END;
$function$
