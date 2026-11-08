CREATE OR REPLACE FUNCTION public.enroll_in_cadence(p_cadence_id uuid, p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_first_step jsonb;
  v_delay_days int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT steps->0 INTO v_first_step FROM sales_cadences WHERE id = p_cadence_id;
  v_delay_days := COALESCE((v_first_step->>'delay_days')::int, 0);
  
  INSERT INTO cadence_enrollments (cadence_id, company_id, contact_id, user_id, next_action_at)
  VALUES (p_cadence_id, p_company_id, p_contact_id, p_user_id, NOW() + (v_delay_days || ' days')::interval)
  ON CONFLICT (cadence_id, company_id) DO UPDATE SET
    status = 'active',
    current_step = 1,
    next_action_at = NOW() + (v_delay_days || ' days')::interval
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$function$
