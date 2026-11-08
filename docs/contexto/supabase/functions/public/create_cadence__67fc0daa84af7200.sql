CREATE OR REPLACE FUNCTION public.create_cadence(p_name text, p_description text, p_steps jsonb, p_target_segment text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO sales_cadences (name, description, steps, target_segment, created_by)
  VALUES (p_name, p_description, p_steps, p_target_segment, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
