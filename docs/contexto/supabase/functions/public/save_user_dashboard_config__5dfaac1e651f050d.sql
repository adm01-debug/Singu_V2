CREATE OR REPLACE FUNCTION public.save_user_dashboard_config(p_config jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  UPDATE profiles SET dashboard_config = p_config, updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$function$
