CREATE OR REPLACE FUNCTION public.rebalance_territories(p_target_per_salesperson integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, user_name text, current_count bigint, suggested_action text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH salesperson_load AS (
    SELECT 
      c.user_id,
      COUNT(*) as company_count
    FROM companies c
    WHERE c.deleted_at IS NULL AND c.status = 'ativo' AND c.user_id IS NOT NULL
    GROUP BY c.user_id
  )
  SELECT 
    sl.user_id,
    p.full_name,
    sl.company_count,
    CASE 
      WHEN sl.company_count > p_target_per_salesperson * 1.5 THEN 'SOBRECARREGADO - redistribuir ' || (sl.company_count - p_target_per_salesperson) || ' empresas'
      WHEN sl.company_count < p_target_per_salesperson * 0.5 THEN 'SUBCARREGADO - pode receber mais ' || (p_target_per_salesperson - sl.company_count) || ' empresas'
      ELSE 'OK - dentro do range ideal'
    END
  FROM salesperson_load sl
  LEFT JOIN profiles p ON p.id = sl.user_id
  ORDER BY sl.company_count DESC;
END;
$function$
