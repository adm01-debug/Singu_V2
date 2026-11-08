CREATE OR REPLACE FUNCTION public.log_activity(p_type text, p_description text, p_contact_id uuid DEFAULT NULL::uuid, p_company_id uuid DEFAULT NULL::uuid, p_interaction_id uuid DEFAULT NULL::uuid, p_data jsonb DEFAULT '{}'::jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  PERFORM public.assert_self_user_id(p_user_id);

  INSERT INTO activities (
      user_id, type, description,
      contact_id, company_id, interaction_id, data
  ) VALUES (
      p_user_id, p_type, p_description,
      p_contact_id, p_company_id, p_interaction_id, p_data
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$
