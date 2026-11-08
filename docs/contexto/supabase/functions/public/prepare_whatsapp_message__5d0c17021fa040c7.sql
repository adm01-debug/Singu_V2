CREATE OR REPLACE FUNCTION public.prepare_whatsapp_message(p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_message_template text DEFAULT NULL::text, p_custom_message text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact_id uuid;
  v_contact_name text;
  v_company_name text;
  v_phone text;
  v_message text;
BEGIN
  -- Busca dados da empresa
  SELECT COALESCE(nome_fantasia, nome_crm, razao_social) INTO v_company_name 
  FROM companies WHERE id = p_company_id;
  
  IF p_contact_id IS NOT NULL THEN
    -- Contato específico
    SELECT ct.id, COALESCE(ct.full_name, ct.first_name)
    INTO v_contact_id, v_contact_name
    FROM contacts ct WHERE ct.id = p_contact_id;
    
    -- Busca telefone do contato
    SELECT cp.numero INTO v_phone
    FROM contact_phones cp 
    WHERE cp.contact_id = p_contact_id 
    ORDER BY cp.is_whatsapp DESC NULLS LAST, cp.is_primary DESC NULLS LAST
    LIMIT 1;
  ELSE
    -- Busca primeiro contato com telefone
    SELECT ct.id, COALESCE(ct.full_name, ct.first_name)
    INTO v_contact_id, v_contact_name
    FROM contacts ct
    JOIN contact_phones cp ON cp.contact_id = ct.id
    WHERE ct.company_id = p_company_id AND ct.deleted_at IS NULL
    ORDER BY cp.is_whatsapp DESC NULLS LAST, cp.is_primary DESC NULLS LAST
    LIMIT 1;
    
    -- Busca telefone desse contato ou da empresa
    SELECT cp.numero INTO v_phone
    FROM contact_phones cp 
    WHERE cp.contact_id = v_contact_id 
    ORDER BY cp.is_whatsapp DESC NULLS LAST, cp.is_primary DESC NULLS LAST
    LIMIT 1;
    
    IF v_phone IS NULL THEN
      SELECT cop.numero INTO v_phone
      FROM company_phones cop 
      WHERE cop.company_id = p_company_id 
      ORDER BY cop.is_whatsapp DESC NULLS LAST, cop.is_primary DESC NULLS LAST
      LIMIT 1;
    END IF;
  END IF;
  
  IF v_phone IS NULL THEN
    RETURN jsonb_build_object('error', 'Nenhum telefone encontrado');
  END IF;
  
  -- Normaliza telefone
  v_phone := regexp_replace(v_phone, '[^0-9]', '', 'g');
  IF length(v_phone) <= 11 THEN
    v_phone := '55' || v_phone;
  END IF;
  
  -- Monta mensagem
  v_message := COALESCE(p_custom_message, p_message_template, 'Olá!');
  v_message := replace(v_message, '{{nome_empresa}}', COALESCE(v_company_name, ''));
  v_message := replace(v_message, '{{nome_contato}}', COALESCE(v_contact_name, ''));
  
  RETURN jsonb_build_object(
    'phone', v_phone,
    'message', v_message,
    'company_id', p_company_id,
    'contact_id', v_contact_id,
    'contact_name', v_contact_name,
    'ready_to_send', true
  );
END;
$function$
