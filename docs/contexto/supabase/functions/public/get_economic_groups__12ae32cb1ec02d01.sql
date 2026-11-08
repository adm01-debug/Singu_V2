CREATE OR REPLACE FUNCTION public.get_economic_groups()
 RETURNS TABLE(group_id uuid, name text, total_companies integer, total_revenue numeric, main_company_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT eg.id, eg.name::text, eg.total_companies,
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d JOIN economic_group_members egm ON egm.company_id = d.company_id WHERE egm.group_id = eg.id AND d.status = 'ganho'),
    (SELECT COALESCE(c.nome_fantasia, c.nome_crm)::text FROM companies c WHERE c.id = eg.main_company_id)
  FROM economic_groups eg ORDER BY 4 DESC;
END;
$function$
