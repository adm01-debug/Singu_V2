CREATE OR REPLACE FUNCTION public.export_companies_full(filter_user_id uuid DEFAULT NULL::uuid, max_limit integer DEFAULT 1000, start_offset integer DEFAULT 0)
 RETURNS TABLE(company_id uuid, cnpj text, nome text, razao_social text, ramo text, email_principal text, telefone_principal text, cidade text, estado text, status_empresa text, is_customer boolean, lead_score integer, responsavel text, ultima_interacao timestamp with time zone, total_interacoes bigint, data_criacao timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.id,
    c.cnpj,
    COALESCE(c.nome_fantasia, c.nome_crm),
    c.razao_social,
    c.ramo_atividade,
    (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id LIMIT 1),
    (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id LIMIT 1),
    (SELECT ca.cidade FROM company_addresses ca WHERE ca.company_id = c.id LIMIT 1),
    (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = c.id LIMIT 1),
    c.status::text,
    c.is_customer,
    COALESCE(c.lead_score, 0),
    (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = c.user_id),
    (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id),
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id),
    c.created_at
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND (filter_user_id IS NULL OR c.user_id = filter_user_id)
  ORDER BY c.created_at DESC
  LIMIT max_limit OFFSET start_offset;
$function$
