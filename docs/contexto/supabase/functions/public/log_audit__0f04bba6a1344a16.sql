CREATE OR REPLACE FUNCTION public.log_audit(p_action text, p_table_name text, p_record_id text, p_old_data jsonb DEFAULT NULL::jsonb, p_new_data jsonb DEFAULT NULL::jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO audit_log (action, table_name, record_id, old_data, new_data, user_id)
  VALUES (p_action, p_table_name, p_record_id, p_old_data, p_new_data, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
