CREATE OR REPLACE FUNCTION public.use_template(p_template_id uuid, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_content text; v_company companies%ROWTYPE;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  UPDATE interaction_templates SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = p_template_id RETURNING content INTO v_content;
  IF p_company_id IS NOT NULL THEN
    SELECT * INTO v_company FROM companies WHERE id = p_company_id;
    v_content := REPLACE(v_content, '{{nome_empresa}}', COALESCE(v_company.nome_fantasia, v_company.nome_crm, ''));
  END IF;
  RETURN v_content;
END;
$function$
