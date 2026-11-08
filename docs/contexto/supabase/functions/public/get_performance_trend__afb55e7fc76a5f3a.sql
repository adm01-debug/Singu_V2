CREATE OR REPLACE FUNCTION public.get_performance_trend(p_user_id uuid DEFAULT auth.uid(), p_months integer DEFAULT 6)
 RETURNS TABLE(month text, interactions bigint, companies bigint, contacts_added bigint, trend_direction text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  WITH monthly AS (
    SELECT 
      TO_CHAR(d.month, 'YYYY-MM') as month,
      (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND DATE_TRUNC('month', created_at) = d.month) as interactions,
      (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND DATE_TRUNC('month', created_at) = d.month) as companies,
      (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE c.user_id = p_user_id AND DATE_TRUNC('month', ct.created_at) = d.month) as contacts_added
    FROM generate_series(
      DATE_TRUNC('month', CURRENT_DATE - (p_months || ' months')::interval),
      DATE_TRUNC('month', CURRENT_DATE),
      '1 month'::interval
    ) d(month)
  )
  SELECT 
    m.month,
    m.interactions,
    m.companies,
    m.contacts_added,
    CASE 
      WHEN m.interactions > LAG(m.interactions) OVER (ORDER BY m.month) THEN 'up'
      WHEN m.interactions < LAG(m.interactions) OVER (ORDER BY m.month) THEN 'down'
      ELSE 'stable'
    END as trend_direction
  FROM monthly m
  ORDER BY m.month;
END;
$function$
