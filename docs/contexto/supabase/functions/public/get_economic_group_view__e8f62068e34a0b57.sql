CREATE OR REPLACE FUNCTION public.get_economic_group_view(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT jsonb_build_object('group_id', eg.id, 'name', eg.name, 'total_companies', eg.total_companies,
    'total_revenue', (SELECT COALESCE(SUM(d.valor), 0) FROM deals d JOIN economic_group_members egm ON egm.company_id = d.company_id WHERE egm.group_id = eg.id AND d.status = 'ganho'),
    'companies', (SELECT jsonb_agg(jsonb_build_object('company_id', c.id, 'name', COALESCE(c.nome_fantasia, c.nome_crm), 'role', egm.role)) FROM economic_group_members egm JOIN companies c ON c.id = egm.company_id WHERE egm.group_id = eg.id)
  ) FROM economic_groups eg WHERE eg.id = p_group_id);
END;
$function$
