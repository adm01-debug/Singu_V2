CREATE OR REPLACE FUNCTION public.get_companies_by_rfm_segment(p_segment text, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, name text, combined_score numeric, recency_score integer, frequency_score integer, monetary_score integer, total_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT r.company_id, COALESCE(c.nome_fantasia, c.nome_crm), r.combined_score, r.recency_score, r.frequency_score, r.monetary_score, r.total_value
  FROM company_rfm_scores r
  JOIN companies c ON c.id = r.company_id
  WHERE 
    (p_segment = 'Champions' AND r.combined_score >= 4.5) OR
    (p_segment = 'Loyal' AND r.combined_score >= 4.0 AND r.combined_score < 4.5) OR
    (p_segment = 'Potential' AND r.combined_score >= 3.5 AND r.combined_score < 4.0) OR
    (p_segment = 'Need Attention' AND r.combined_score >= 2.0 AND r.combined_score < 2.5) OR
    (p_segment = 'Lost' AND r.combined_score < 1.5)
  ORDER BY r.combined_score DESC
  LIMIT p_limit;
$function$
