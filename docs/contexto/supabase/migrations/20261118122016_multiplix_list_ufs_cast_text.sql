-- repo: 20261118123000_multiplix_list_ufs_cast_text.sql
-- Cast explicito varchar(2) -> text no contrato de multiplix_list_ufs(),
-- alinhando ao padrao da PR #70 (search_audience / resolve_recipients).
CREATE OR REPLACE FUNCTION public.multiplix_list_ufs()
RETURNS TABLE(uf text, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
    SELECT ca.estado::text AS uf, count(DISTINCT ca.company_id)::bigint AS total
    FROM public.company_addresses ca
    JOIN public.companies c ON c.id = ca.company_id
    WHERE ca.is_primary = true AND ca.estado IS NOT NULL
      AND c.deleted_at IS NULL AND c.status = 'ativo'
    GROUP BY 1
    ORDER BY total DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.multiplix_list_ufs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.multiplix_list_ufs() TO service_role;
