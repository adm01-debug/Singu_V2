-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321193902
-- nome:   fix_search_path_include_dormant

-- ============================================================
-- FIX: Adicionar _dormant ao search_path do banco
-- Para que functions encontrem tabelas em ambos os schemas
-- ============================================================

ALTER DATABASE postgres SET search_path TO public, _dormant, extensions;

COMMENT ON SCHEMA _dormant IS 'Tabelas vazias movidas do public em 2026-03-21. Incluído no search_path para compatibilidade com functions existentes. Reverter tabela: ALTER TABLE _dormant.xxx SET SCHEMA public;';
