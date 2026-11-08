CREATE OR REPLACE FUNCTION public.get_churn_prediction_list(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, dias_sem_contato integer, valor_historico numeric, risco text, vendedor text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    COALESCE(EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id))::int, 999) as dias_sem_contato,
    cu.valor_total_compras as valor_historico,
    CASE 
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 90 THEN 'crítico'
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 60 THEN 'alto'
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 30 THEN 'médio'
      ELSE 'baixo'
    END as risco,
    s.nome as vendedor
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL AND cu.ja_comprou = true
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  ORDER BY dias_sem_contato DESC
  LIMIT p_limit;
END;
$function$
