CREATE OR REPLACE FUNCTION public.get_daily_productivity(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'date', p_date, 'user_id', p_user_id,
    'interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND DATE(data_interacao) = p_date),
    'companies_contacted', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE user_id = p_user_id AND DATE(data_interacao) = p_date),
    'deals_created', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND DATE(created_at) = p_date),
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND DATE(closed_at) = p_date AND status = 'ganho')
  ) INTO v_result;
  RETURN v_result;
END;
$function$
