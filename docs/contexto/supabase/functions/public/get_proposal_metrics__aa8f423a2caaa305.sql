CREATE OR REPLACE FUNCTION public.get_proposal_metrics(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sent', COUNT(*) FILTER (WHERE status IN ('sent', 'accepted', 'rejected')),
    'accepted', COUNT(*) FILTER (WHERE status = 'accepted'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'pending', COUNT(*) FILTER (WHERE status = 'draft' OR status = 'sent'),
    'total_value_accepted', COALESCE(SUM(valor_total) FILTER (WHERE status = 'accepted'), 0),
    'avg_value', ROUND(AVG(valor_total), 2),
    'conversion_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'accepted')::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'accepted', 'rejected')), 0) * 100, 1
    )
  ) INTO v_result
  FROM proposals
  WHERE created_at >= CURRENT_DATE - p_days;
  
  RETURN v_result;
END;
$function$
