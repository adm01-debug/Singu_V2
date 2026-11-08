CREATE OR REPLACE FUNCTION public.get_leads_by_score(p_min_score integer DEFAULT 0, p_grade text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, lead_score integer, grade text, status company_status, is_customer boolean, last_interaction timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    COALESCE(c.lead_score, 0)::integer,
    CASE 
      WHEN COALESCE(c.lead_score, 0) >= 80 THEN 'A'
      WHEN COALESCE(c.lead_score, 0) >= 60 THEN 'B'
      WHEN COALESCE(c.lead_score, 0) >= 40 THEN 'C'
      WHEN COALESCE(c.lead_score, 0) >= 20 THEN 'D'
      ELSE 'F'
    END,
    c.status,
    c.is_customer,
    (SELECT MAX(data_interacao) FROM interactions WHERE interactions.company_id = c.id)
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND COALESCE(c.lead_score, 0) >= p_min_score
    AND (p_grade IS NULL OR 
      CASE 
        WHEN COALESCE(c.lead_score, 0) >= 80 THEN 'A'
        WHEN COALESCE(c.lead_score, 0) >= 60 THEN 'B'
        WHEN COALESCE(c.lead_score, 0) >= 40 THEN 'C'
        WHEN COALESCE(c.lead_score, 0) >= 20 THEN 'D'
        ELSE 'F'
      END = p_grade)
  ORDER BY c.lead_score DESC NULLS LAST
  LIMIT p_limit;
END;
$function$
