CREATE OR REPLACE FUNCTION public.generate_seller_report(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'user_id', p_user_id, 'period_days', p_days,
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'deals_won', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - (p_days || ' days')::interval)
  );
END;
$function$
