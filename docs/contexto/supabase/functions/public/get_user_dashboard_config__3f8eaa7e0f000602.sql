CREATE OR REPLACE FUNCTION public.get_user_dashboard_config(p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_config jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT dashboard_config INTO v_config FROM profiles WHERE id = p_user_id;
  
  -- Retorna config ou padrão
  RETURN COALESCE(v_config, jsonb_build_object(
    'widgets', jsonb_build_array(
      jsonb_build_object('type', 'quick_counts', 'position', 1, 'size', 'large'),
      jsonb_build_object('type', 'recent_interactions', 'position', 2, 'size', 'medium'),
      jsonb_build_object('type', 'pending_followups', 'position', 3, 'size', 'medium'),
      jsonb_build_object('type', 'goals_progress', 'position', 4, 'size', 'small')
    ),
    'theme', 'light',
    'refresh_interval', 300
  ));
END;
$function$
