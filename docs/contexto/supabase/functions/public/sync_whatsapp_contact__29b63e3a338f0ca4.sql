CREATE OR REPLACE FUNCTION public.sync_whatsapp_contact(p_phone text, p_name text DEFAULT NULL::text, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact_id uuid;
  v_company_id uuid := p_company_id;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id FROM company_phones WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g') LIMIT 1;
  END IF;
  IF v_company_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Empresa não encontrada'); END IF;
  SELECT id INTO v_contact_id FROM contacts WHERE company_id = v_company_id AND full_name = p_name LIMIT 1;
  IF v_contact_id IS NULL AND p_name IS NOT NULL THEN
    INSERT INTO contacts (company_id, full_name, first_name) VALUES (v_company_id, p_name, SPLIT_PART(p_name, ' ', 1)) RETURNING id INTO v_contact_id;
  END IF;
  RETURN jsonb_build_object('success', true, 'company_id', v_company_id, 'contact_id', v_contact_id);
END;
$function$
