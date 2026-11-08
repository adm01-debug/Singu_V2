CREATE OR REPLACE FUNCTION public.process_email_template(p_template_id uuid, p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template RECORD;
  v_company RECORD;
  v_contact RECORD;
  v_subject text;
  v_content text;
BEGIN
  SELECT * INTO v_template FROM interaction_templates WHERE id = p_template_id;
  
  SELECT 
    COALESCE(nome_fantasia, nome_crm, razao_social) as name,
    ramo_atividade as segment
  INTO v_company FROM companies WHERE id = p_company_id;
  
  IF p_contact_id IS NOT NULL THEN
    SELECT 
      COALESCE(full_name, first_name) as name,
      cargo as position
    INTO v_contact FROM contacts WHERE id = p_contact_id;
  END IF;
  
  v_subject := v_template.subject;
  v_content := v_template.content;
  
  -- Substituir variáveis
  v_subject := REPLACE(v_subject, '{{empresa}}', COALESCE(v_company.name, ''));
  v_subject := REPLACE(v_subject, '{{contato}}', COALESCE(v_contact.name, ''));
  v_content := REPLACE(v_content, '{{empresa}}', COALESCE(v_company.name, ''));
  v_content := REPLACE(v_content, '{{contato}}', COALESCE(v_contact.name, ''));
  v_content := REPLACE(v_content, '{{cargo}}', COALESCE(v_contact.position, ''));
  v_content := REPLACE(v_content, '{{segmento}}', COALESCE(v_company.segment, ''));
  
  RETURN jsonb_build_object(
    'template_id', p_template_id,
    'template_name', v_template.name,
    'subject', v_subject,
    'content', v_content,
    'processed_at', NOW()
  );
END;
$function$
