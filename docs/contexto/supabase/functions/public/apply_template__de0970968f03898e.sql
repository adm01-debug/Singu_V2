CREATE OR REPLACE FUNCTION public.apply_template(p_template_id uuid, p_company_id uuid DEFAULT NULL::uuid, p_contact_id uuid DEFAULT NULL::uuid, p_extra_vars jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template message_templates%ROWTYPE;
  v_body text;
  v_subject text;
  v_company companies%ROWTYPE;
  v_contact contacts%ROWTYPE;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  SELECT * INTO v_template FROM message_templates WHERE id = p_template_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Template não encontrado'); END IF;
  
  IF p_company_id IS NOT NULL THEN SELECT * INTO v_company FROM companies WHERE id = p_company_id; END IF;
  IF p_contact_id IS NOT NULL THEN SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id; END IF;
  
  v_body := v_template.body;
  v_subject := v_template.subject;
  
  -- Substituir variáveis
  v_body := REPLACE(v_body, '{{empresa}}', COALESCE(v_company.nome_fantasia, v_company.nome_crm, ''));
  v_body := REPLACE(v_body, '{{nome}}', COALESCE(v_contact.first_name, ''));
  v_body := REPLACE(v_body, '{{nome_completo}}', COALESCE(v_contact.full_name, ''));
  v_body := REPLACE(v_body, '{{email}}', COALESCE(v_contact.email, ''));
  
  IF v_subject IS NOT NULL THEN
    v_subject := REPLACE(v_subject, '{{empresa}}', COALESCE(v_company.nome_fantasia, v_company.nome_crm, ''));
    v_subject := REPLACE(v_subject, '{{nome}}', COALESCE(v_contact.first_name, ''));
  END IF;
  
  -- Incrementar uso
  UPDATE message_templates SET use_count = use_count + 1 WHERE id = p_template_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'channel', v_template.channel,
    'subject', v_subject,
    'body', v_body
  );
END;
$function$
