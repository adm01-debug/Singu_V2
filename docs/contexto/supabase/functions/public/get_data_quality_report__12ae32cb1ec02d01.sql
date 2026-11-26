CREATE OR REPLACE FUNCTION public.get_data_quality_report()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'companies_total', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
    'companies_without_cnpj', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND (cnpj IS NULL OR cnpj = '')),
    'companies_without_email', (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM company_emails ce WHERE ce.company_id = c.id)),
    'companies_without_owner', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND user_id IS NULL),
    'contacts_total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
    'contacts_orphans', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL AND company_id IS NULL),
    'deals_stalled', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '14 days'),
    'generated_at', NOW()
  ) INTO v_result;
  RETURN v_result;
END;
$function$
