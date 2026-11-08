CREATE OR REPLACE FUNCTION public.get_email_stats(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'total_sent', COUNT(*) FILTER (WHERE direction = 'outbound'),
      'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
      'opened', COUNT(*) FILTER (WHERE status = 'opened'),
      'clicked', COUNT(*) FILTER (WHERE status = 'clicked'),
      'bounced', COUNT(*) FILTER (WHERE status = 'bounced'),
      'open_rate', ROUND(COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::numeric / NULLIF(COUNT(*) FILTER (WHERE direction = 'outbound'), 0) * 100, 2),
      'click_rate', ROUND(COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::numeric / NULLIF(COUNT(*) FILTER (WHERE opened_at IS NOT NULL), 0) * 100, 2),
      'period_days', p_days
    )
    FROM email_logs
    WHERE created_at >= NOW() - (p_days || ' days')::interval
      AND (p_user_id IS NULL OR user_id = p_user_id)
  );
END;
$function$
