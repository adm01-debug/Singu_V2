CREATE OR REPLACE FUNCTION public.get_rfm_segments()
 RETURNS TABLE(segment text, description text, company_count bigint, avg_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT 
    CASE 
      WHEN combined_score >= 4.5 THEN 'Champions'
      WHEN combined_score >= 4.0 THEN 'Loyal'
      WHEN combined_score >= 3.5 THEN 'Potential'
      WHEN combined_score >= 3.0 THEN 'New Customers'
      WHEN combined_score >= 2.5 THEN 'Promising'
      WHEN combined_score >= 2.0 THEN 'Need Attention'
      WHEN combined_score >= 1.5 THEN 'About to Sleep'
      ELSE 'Lost'
    END,
    CASE 
      WHEN combined_score >= 4.5 THEN 'Melhores clientes, alta frequência e valor'
      WHEN combined_score >= 4.0 THEN 'Clientes fiéis com bom histórico'
      WHEN combined_score >= 3.5 THEN 'Potencial para se tornarem champions'
      WHEN combined_score >= 3.0 THEN 'Clientes recentes, cultivar relacionamento'
      WHEN combined_score >= 2.5 THEN 'Compradores promissores'
      WHEN combined_score >= 2.0 THEN 'Precisam de atenção para não perder'
      WHEN combined_score >= 1.5 THEN 'Risco de se tornarem inativos'
      ELSE 'Clientes perdidos, reativação difícil'
    END,
    COUNT(*),
    ROUND(AVG(total_value), 2)
  FROM company_rfm_scores
  GROUP BY 1, 2
  ORDER BY AVG(combined_score) DESC;
$function$
