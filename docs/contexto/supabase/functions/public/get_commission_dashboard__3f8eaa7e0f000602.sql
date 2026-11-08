CREATE OR REPLACE FUNCTION public.get_commission_dashboard(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'pending', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE status = 'pending'),
        'value', COALESCE(SUM(commission_value) FILTER (WHERE status = 'pending'), 0)
      ),
      'approved', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE status = 'approved'),
        'value', COALESCE(SUM(commission_value) FILTER (WHERE status = 'approved'), 0)
      ),
      'paid_this_month', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE status = 'paid' AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)),
        'value', COALESCE(SUM(commission_value) FILTER (WHERE status = 'paid' AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)), 0)
      ),
      'paid_total', jsonb_build_object(
        'count', COUNT(*) FILTER (WHERE status = 'paid'),
        'value', COALESCE(SUM(commission_value) FILTER (WHERE status = 'paid'), 0)
      )
    )
    FROM commissions
    WHERE user_id = p_user_id
  );
END;
$function$
