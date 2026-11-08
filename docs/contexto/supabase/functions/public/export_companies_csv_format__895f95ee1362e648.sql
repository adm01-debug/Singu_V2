CREATE OR REPLACE FUNCTION public.export_companies_csv_format(filter_status text DEFAULT NULL::text, max_limit integer DEFAULT 1000, start_offset integer DEFAULT 0)
 RETURNS TABLE(company_id uuid, cnpj text, nome text, email_principal text, telefone_principal text, cidade text, estado text, status_empresa text, lead_score integer, ultima_interacao timestamp with time zone, total_interacoes bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.id,
    c.cnpj,
    COALESCE(c.nome_fantasia, c.nome_crm),
    (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id LIMIT 1),
    (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id LIMIT 1),
    (SELECT ca.cidade FROM company_addresses ca WHERE ca.company_id = c.id LIMIT 1),
    (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = c.id LIMIT 1),
    c.status::text,
    COALESCE(c.lead_score, 0),
    (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id),
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id)
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND (filter_status IS NULL OR c.status = filter_status::company_status)
  ORDER BY c.created_at DESC
  LIMIT max_limit OFFSET start_offset;
$function$
