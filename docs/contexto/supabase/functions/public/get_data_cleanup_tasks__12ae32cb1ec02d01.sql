CREATE OR REPLACE FUNCTION public.get_data_cleanup_tasks()
 RETURNS TABLE(task text, affected_count bigint, priority text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'CNPJs inválidos'::text, COUNT(*)::bigint, 'ALTA'::text FROM companies WHERE deleted_at IS NULL AND (cnpj IS NULL OR cnpj = '' OR LENGTH(REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')) != 14)
  UNION ALL SELECT 'Contatos órfãos', COUNT(*), 'MÉDIA' FROM contacts WHERE company_id IS NULL AND deleted_at IS NULL
  UNION ALL SELECT 'Empresas sem responsável', COUNT(*), 'MÉDIA' FROM companies WHERE user_id IS NULL AND deleted_at IS NULL
  UNION ALL SELECT 'Empresas sem email', COUNT(*), 'BAIXA' FROM companies c WHERE c.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM company_emails ce WHERE ce.company_id = c.id)
  UNION ALL SELECT 'Empresas sem telefone', COUNT(*), 'BAIXA' FROM companies c WHERE c.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM company_phones cp WHERE cp.company_id = c.id)
  ORDER BY 3, 2 DESC;
$function$
