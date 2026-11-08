CREATE OR REPLACE FUNCTION public.export_companies_csv(p_filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(cnpj text, razao_social text, nome_fantasia text, email text, telefone text, uf text, cidade text, status text, lead_score integer, ultima_interacao date)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.cnpj::text,
    c.razao_social::text,
    c.nome_fantasia::text,
    (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id LIMIT 1)::text,
    (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id LIMIT 1)::text,
    (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = c.id AND ca.is_primary LIMIT 1)::text,
    (SELECT ca.cidade FROM company_addresses ca WHERE ca.company_id = c.id AND ca.is_primary LIMIT 1)::text,
    c.status::text,
    0,
    (SELECT MAX(i.data_interacao)::date FROM interactions i WHERE i.company_id = c.id)
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND (p_filters->>'status' IS NULL OR c.status = (p_filters->>'status')::company_status)
    AND (p_filters->>'uf' IS NULL OR EXISTS (
      SELECT 1 FROM company_addresses ca
      WHERE ca.company_id = c.id AND ca.is_primary AND ca.estado = p_filters->>'uf'))
    AND (p_filters->>'is_customer' IS NULL OR c.is_customer = (p_filters->>'is_customer')::boolean)
  ORDER BY c.nome_fantasia;
END;
$function$
