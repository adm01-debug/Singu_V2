-- ============================================================
-- FIX: Adicionar _dormant ao search_path do banco
-- Para que functions encontrem tabelas em ambos os schemas
-- ============================================================

ALTER DATABASE postgres SET search_path TO public, _dormant, extensions;

COMMENT ON SCHEMA _dormant IS 'Tabelas vazias movidas do public em 2026-03-21. Incluído no search_path para compatibilidade com functions existentes. Reverter tabela: ALTER TABLE _dormant.xxx SET SCHEMA public;';
