CREATE OR REPLACE FUNCTION public.get_economic_group_summary(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'group_id', p_group_id,
    'group_name', (SELECT nome_fantasia FROM companies WHERE id = p_group_id),
    'total_companies', (SELECT COUNT(*) FROM companies WHERE grupo_economico_id = p_group_id AND deleted_at IS NULL),
    'total_revenue', (SELECT COALESCE(SUM(d.valor), 0) FROM deals d JOIN companies c ON c.id = d.company_id WHERE (c.grupo_economico_id = p_group_id OR c.id = p_group_id) AND d.status = 'ganho'),
    'open_pipeline', (SELECT COALESCE(SUM(d.valor), 0) FROM deals d JOIN companies c ON c.id = d.company_id WHERE (c.grupo_economico_id = p_group_id OR c.id = p_group_id) AND d.status NOT IN ('ganho', 'perdido')),
    'total_contacts', (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE (c.grupo_economico_id = p_group_id OR c.id = p_group_id) AND ct.deleted_at IS NULL)
  );
END;
$function$
