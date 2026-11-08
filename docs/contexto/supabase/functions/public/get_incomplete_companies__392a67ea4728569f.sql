CREATE OR REPLACE FUNCTION public.get_incomplete_companies(p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, company_name text, missing_fields text[], completeness_pct integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN c.cnpj IS NULL OR c.cnpj = '' THEN 'CNPJ' END,
      CASE WHEN NOT EXISTS (SELECT 1 FROM company_emails ce WHERE ce.company_id = c.id) THEN 'Email' END,
      CASE WHEN NOT EXISTS (SELECT 1 FROM company_phones cp WHERE cp.company_id = c.id) THEN 'Telefone' END,
      CASE WHEN NOT EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id) THEN 'Contato' END
    ], NULL)::text[],
    (100 - (
      (CASE WHEN c.cnpj IS NULL OR c.cnpj = '' THEN 1 ELSE 0 END +
       CASE WHEN NOT EXISTS (SELECT 1 FROM company_emails ce WHERE ce.company_id = c.id) THEN 1 ELSE 0 END +
       CASE WHEN NOT EXISTS (SELECT 1 FROM company_phones cp WHERE cp.company_id = c.id) THEN 1 ELSE 0 END +
       CASE WHEN NOT EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id) THEN 1 ELSE 0 END
      ) * 100 / 4
    ))::int
  FROM companies c
  WHERE c.deleted_at IS NULL
  ORDER BY 4 ASC
  LIMIT p_limit;
END;
$function$
