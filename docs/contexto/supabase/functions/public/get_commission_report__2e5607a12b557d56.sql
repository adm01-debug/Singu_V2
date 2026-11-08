CREATE OR REPLACE FUNCTION public.get_commission_report(p_start_date date, p_end_date date, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(user_id uuid, user_name text, deals_count bigint, deals_value numeric, commission_value numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    c.user_id,
    pr.full_name::text as user_name,
    COUNT(*)::bigint as deals_count,
    SUM(c.deal_value)::numeric as deals_value,
    SUM(c.commission_value)::numeric as commission_value
  FROM commissions c
  JOIN profiles pr ON pr.id = c.user_id
  WHERE c.created_at::date BETWEEN p_start_date AND p_end_date
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
  GROUP BY c.user_id, pr.full_name
  ORDER BY commission_value DESC;
END;
$function$
