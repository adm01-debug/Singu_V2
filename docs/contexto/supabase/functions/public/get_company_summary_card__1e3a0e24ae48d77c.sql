CREATE OR REPLACE FUNCTION public.get_company_summary_card(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company_id', c.id,
    'name', COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social),
    'cnpj', c.cnpj,
    'segment', c.ramo_atividade,
    'status', c.status,
    'primary_contact', (
      SELECT jsonb_build_object('name', COALESCE(ct.full_name, ct.first_name), 'role', ct.job_title)
      FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL ORDER BY ct.is_primary DESC LIMIT 1
    ),
    'stats', jsonb_build_object(
      'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = c.id),
      'last_interaction', (SELECT MAX(data_interacao) FROM interactions WHERE company_id = c.id),
      'total_contacts', (SELECT COUNT(*) FROM contacts WHERE company_id = c.id AND deleted_at IS NULL)
    ),
    'assigned_to', (SELECT full_name FROM profiles WHERE id = c.user_id)
  ) INTO v_result
  FROM companies c WHERE c.id = p_company_id;
  
  RETURN v_result;
END;
$function$
