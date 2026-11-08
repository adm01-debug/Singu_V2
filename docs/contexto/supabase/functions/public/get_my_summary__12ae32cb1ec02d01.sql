CREATE OR REPLACE FUNCTION public.get_my_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'companies', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM companies WHERE user_id = v_user_id),
      'active', (SELECT COUNT(*) FROM companies WHERE user_id = v_user_id AND status = 'ativo')
    ),
    'interactions', jsonb_build_object(
      'today', (SELECT COUNT(*) FROM interactions WHERE user_id = v_user_id AND created_at::date = CURRENT_DATE),
      'this_week', (SELECT COUNT(*) FROM interactions WHERE user_id = v_user_id AND created_at >= DATE_TRUNC('week', CURRENT_DATE)),
      'this_month', (SELECT COUNT(*) FROM interactions WHERE user_id = v_user_id AND created_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    'notifications', jsonb_build_object(
      'unread', (SELECT COUNT(*) FROM notifications WHERE user_id = v_user_id AND COALESCE(is_read, false) = false)
    ),
    'pending_followups', (
      SELECT COUNT(*) FROM interactions 
      WHERE user_id = v_user_id 
        AND follow_up_date IS NOT NULL 
        AND follow_up_date <= CURRENT_DATE
    )
  );
END;
$function$
