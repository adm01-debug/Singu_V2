-- Torna explícito o cast de company_addresses.estado (varchar(2)) para o text
-- declarado em RETURNS TABLE de public.multiplix_list_ufs().
--
-- Origem: trabalho iniciado na branch claude/fix-recuperacao-trabalhos-261117-2140
-- (agente Codex, 18/11/2026) e concluído aqui.
--
-- Escopo honesto: NÃO é correção de falha. Verificado em produção
-- (pgxfvjmuubtbowutlide, 18/11/2026) que a função já retornava 27 linhas, porque
-- varchar -> text é binário-coercível e o RETURN QUERY aceita. O ganho é de
-- contrato: alinha esta função ao mesmo padrão já aplicado em
-- multiplix_search_audience e multiplix_resolve_recipients pela PR #70
-- ("cast varchar->text"), evitando que uma futura troca do tipo da coluna
-- (ex.: para char(2), que não é coercível) quebre a função em runtime.
--
-- Idempotente: CREATE OR REPLACE. Permissões reafirmadas sem alteração.

BEGIN;

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

COMMIT;

-- ROLLBACK (restaura a definição sem o cast explícito):
/*
BEGIN;
CREATE OR REPLACE FUNCTION public.multiplix_list_ufs()
RETURNS TABLE(uf text, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
    SELECT ca.estado AS uf, count(DISTINCT ca.company_id)::bigint AS total
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
COMMIT;
*/
