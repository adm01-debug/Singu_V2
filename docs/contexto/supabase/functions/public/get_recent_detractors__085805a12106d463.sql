CREATE OR REPLACE FUNCTION public.get_recent_detractors(p_days integer DEFAULT 30, p_limit integer DEFAULT 50)
 RETURNS TABLE(survey_id uuid, company_id uuid, company_name text, score integer, feedback text, responded_at timestamp with time zone, contact_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.company_id,
    c.nome_crm,
    cs.score,
    cs.feedback,
    cs.responded_at,
    ct.full_name
  FROM customer_surveys cs
  JOIN companies c ON c.id = cs.company_id
  LEFT JOIN contacts ct ON ct.id = cs.contact_id
  WHERE cs.survey_type = 'nps'
    AND cs.category = 'detractor'
    AND cs.responded_at >= CURRENT_DATE - p_days
  ORDER BY cs.responded_at DESC
  LIMIT p_limit;
END;
$function$
