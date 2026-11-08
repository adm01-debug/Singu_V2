CREATE OR REPLACE FUNCTION public.create_economic_group(p_name text, p_main_company_id uuid, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_group_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_main_company_id);

  INSERT INTO economic_groups (name, description, main_company_id, total_companies)
  VALUES (p_name, p_description, p_main_company_id, 1)
  RETURNING id INTO v_group_id;

  INSERT INTO economic_group_members (group_id, company_id, role)
  VALUES (v_group_id, p_main_company_id, 'main');

  RETURN jsonb_build_object('success', true, 'group_id', v_group_id);
END;
$function$
