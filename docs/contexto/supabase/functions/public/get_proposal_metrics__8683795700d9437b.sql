CREATE OR REPLACE FUNCTION public.get_proposal_metrics(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'total_value', COALESCE(SUM(total_value), 0),
      'by_status', jsonb_build_object(
        'draft', COUNT(*) FILTER (WHERE status = 'draft'),
        'sent', COUNT(*) FILTER (WHERE status = 'sent'),
        'accepted', COUNT(*) FILTER (WHERE status = 'accepted'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'expired', COUNT(*) FILTER (WHERE status NOT IN ('accepted', 'rejected') AND valid_until < CURRENT_DATE)
      ),
      'conversion_rate', ROUND(
        COUNT(*) FILTER (WHERE status = 'accepted')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected')), 0)::numeric * 100, 2
      ),
      'avg_value', ROUND(AVG(total_value), 2),
      'accepted_value', COALESCE(SUM(total_value) FILTER (WHERE status = 'accepted'), 0),
      'pending_value', COALESCE(SUM(total_value) FILTER (WHERE status IN ('draft', 'sent')), 0)
    )
    FROM proposals
    WHERE created_at >= NOW() - (p_days || ' days')::interval
      AND (p_user_id IS NULL OR user_id = p_user_id)
  );
EXCEPTION WHEN undefined_table THEN
  RETURN jsonb_build_object('total', 0, 'message', 'Nenhuma proposta registrada');
END;
$function$
