-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321192912
-- nome:   create_dormant_schema_move_empty_tables

-- ============================================================
-- A2: Mover 223 tabelas vazias para schema _dormant
-- Reversível: ALTER TABLE _dormant.xxx SET SCHEMA public;
-- ============================================================

CREATE SCHEMA IF NOT EXISTS _dormant;
COMMENT ON SCHEMA _dormant IS 'Tabelas vazias movidas do public em 2026-03-21. Reverter: ALTER TABLE _dormant.xxx SET SCHEMA public;';

-- Mover via DO block dinâmico
DO $$
DECLARE
  r RECORD;
  moved INT := 0;
BEGIN
  FOR r IN 
    SELECT t.relname as tbl
    FROM pg_class t 
    JOIN pg_namespace n ON n.oid = t.relnamespace 
    WHERE n.nspname = 'public' AND t.relkind = 'r' AND t.reltuples <= 0
    AND t.relname NOT IN ('clients','interactions','permissions','sales','salespeople')
    ORDER BY t.relname
  LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.' || quote_ident(r.tbl) || ' SET SCHEMA _dormant';
      moved := moved + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Falha ao mover %: %', r.tbl, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Total movidas: %', moved;
END $$;
