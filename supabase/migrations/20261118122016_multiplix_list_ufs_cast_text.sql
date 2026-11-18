-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20261118122016
-- nome:   multiplix_list_ufs_cast_text

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
