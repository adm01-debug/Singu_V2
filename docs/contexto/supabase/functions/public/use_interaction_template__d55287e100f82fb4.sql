CREATE OR REPLACE FUNCTION public.use_interaction_template(p_template_id uuid, p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_custom_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template record;
  v_content text;
  v_interaction_id uuid;
BEGIN
  SELECT * INTO v_template FROM interaction_templates WHERE id = p_template_id;
  
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template não encontrado';
  END IF;
  
  v_content := COALESCE(p_custom_notes, v_template.content);
  
  INSERT INTO interactions (
    company_id, contact_id, type, channel, direction, resumo, content, user_id, data_interacao
  )
  VALUES (
    p_company_id, 
    p_contact_id, 
    v_template.type,
    COALESCE(v_template.type, 'email'),
    'outbound',
    v_content,
    v_content,
    auth.uid(),
    NOW()
  )
  RETURNING id INTO v_interaction_id;
  
  -- Incrementa uso do template
  UPDATE interaction_templates SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = p_template_id;
  
  RETURN v_interaction_id;
END;
$function$
