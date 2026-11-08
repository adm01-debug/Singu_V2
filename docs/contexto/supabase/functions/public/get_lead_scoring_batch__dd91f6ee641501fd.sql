CREATE OR REPLACE FUNCTION public.get_lead_scoring_batch(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, company_name text, health_score integer, opportunity_score integer, combined_score integer, priority_rank integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  WITH scores AS (
    SELECT 
      c.id,
      c.nome_fantasia,
      (get_company_health_score(c.id)->>'health_score')::INT as health,
      (get_opportunity_score(c.id)->>'opportunity_score')::INT as opportunity
    FROM companies c
    WHERE c.deleted_at IS NULL
      AND c.status = 'ativo'
      AND (p_user_id IS NULL OR c.user_id = p_user_id)
    LIMIT p_limit
  )
  SELECT 
    id,
    nome_fantasia::TEXT,
    health,
    opportunity,
    (health + opportunity) / 2,
    ROW_NUMBER() OVER (ORDER BY (health + opportunity) DESC)::INT
  FROM scores
  ORDER BY (health + opportunity) DESC;
END;
$function$
