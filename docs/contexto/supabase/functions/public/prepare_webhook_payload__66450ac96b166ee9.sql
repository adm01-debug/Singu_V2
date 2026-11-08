CREATE OR REPLACE FUNCTION public.prepare_webhook_payload(p_company_id uuid, p_event_type text DEFAULT 'company_update'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company jsonb;
  v_contacts jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'nome', COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social),
    'cnpj', c.cnpj,
    'status', c.status,
    'email', (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary LIMIT 1),
    'telefone', (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary LIMIT 1)
  ) INTO v_company
  FROM companies c
  WHERE c.id = p_company_id;
  
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ct.id,
    'nome', COALESCE(ct.full_name, ct.first_name),
    'cargo', ct.cargo,
    'email', (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1),
    'telefone', (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1)
  )), '[]'::jsonb) INTO v_contacts
  FROM contacts ct
  WHERE ct.company_id = p_company_id AND ct.deleted_at IS NULL;
  
  RETURN jsonb_build_object(
    'event_type', p_event_type,
    'timestamp', NOW(),
    'company', v_company,
    'contacts', v_contacts
  );
END;
$function$
