CREATE OR REPLACE FUNCTION public.get_seller_performance(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'user_id', p_user_id, 'period_days', p_days,
    'deals_created', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND created_at >= NOW() - (p_days || ' days')::interval),
    'deals_won', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'deals_lost', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'perdido' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval),
    'interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - (p_days || ' days')::interval),
    'companies_contacted', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - (p_days || ' days')::interval)
  ) INTO v_result;
  RETURN v_result;
END;
$function$
