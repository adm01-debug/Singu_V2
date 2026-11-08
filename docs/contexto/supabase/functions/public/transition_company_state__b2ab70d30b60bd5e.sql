CREATE OR REPLACE FUNCTION public.transition_company_state(p_company_id uuid, p_new_status text, p_reason text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_status text;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT status::text INTO v_old_status FROM companies WHERE id = p_company_id;
  
  UPDATE companies SET status = p_new_status::company_status, updated_at = NOW()
  WHERE id = p_company_id;
  
  IF FOUND THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'status_change', 'company', p_company_id, jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_new_status,
      'reason', p_reason
    ));
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$
