CREATE OR REPLACE FUNCTION public.get_contact_360_by_phone(p_phone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_normalized text;
  v_contact contacts%ROWTYPE;
  v_company companies%ROWTYPE;
  v_result jsonb;
BEGIN
  v_normalized := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  
  -- Buscar contato
  SELECT ct.* INTO v_contact
  FROM contacts ct
  JOIN contact_phones cp ON cp.contact_id = ct.id
  WHERE REGEXP_REPLACE(cp.numero, '[^0-9]', '', 'g') LIKE '%' || v_normalized || '%'
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'phone', p_phone);
  END IF;
  
  -- Buscar empresa
  SELECT * INTO v_company FROM companies WHERE id = v_contact.company_id;
  
  RETURN jsonb_build_object(
    'found', true,
    'contact', jsonb_build_object(
      'id', v_contact.id,
      'name', COALESCE(v_contact.full_name, v_contact.first_name),
      'company_id', v_contact.company_id
    ),
    'company', CASE WHEN v_company.id IS NOT NULL THEN jsonb_build_object(
      'id', v_company.id,
      'name', COALESCE(v_company.nome_fantasia, v_company.nome_crm),
      'cnpj', v_company.cnpj
    ) ELSE NULL END,
    'recent_interactions', (
      SELECT jsonb_agg(jsonb_build_object('id', i.id, 'type', i.type, 'date', i.data_interacao))
      FROM (SELECT id, type, data_interacao FROM interactions WHERE company_id = v_contact.company_id ORDER BY data_interacao DESC LIMIT 5) i
    )
  );
END;
$function$
