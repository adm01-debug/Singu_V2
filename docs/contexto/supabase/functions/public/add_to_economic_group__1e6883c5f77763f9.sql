CREATE OR REPLACE FUNCTION public.add_to_economic_group(p_group_id uuid, p_company_id uuid, p_role text DEFAULT 'member'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO economic_group_members (group_id, company_id, role) VALUES (p_group_id, p_company_id, p_role) ON CONFLICT (group_id, company_id) DO UPDATE SET role = p_role;
  UPDATE economic_groups SET total_companies = (SELECT COUNT(*) FROM economic_group_members WHERE group_id = p_group_id), updated_at = NOW() WHERE id = p_group_id;
  RETURN jsonb_build_object('success', true);
END;
$function$
