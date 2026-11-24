-- Fecha a pendencia da migration 20261114124000_remove_duplicate_indexes.sql: ela manda
-- dropar public.idx_health_snapshots_timestamp_desc (duplicado exato de
-- public.idx_system_health_snapshots_timestamp), mas a versao que a producao registrou em
-- supabase_migrations.schema_migrations (20261118121105, reconstruida em
-- 20261118121105_remove_duplicate_indexes.sql) lista somente 17 dos 18 nomes e nao inclui
-- este. Conferido no banco canonico (pgxfvjmuubtbowutlide) em 2026-11-24: o indice continua
-- em producao e o par e identico em colunas, ordem, opcoes, classe de operador, predicado,
-- expressoes, unicidade e reloptions (pg_index); nenhum dos dois sustenta constraint
-- (pg_constraint.conindid).
--
-- Operacao atomica, idempotente e que recusa qualquer divergencia antes de dropar.
-- O gemeo e mantido; nada no codigo referencia indice por nome.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $migration$
DECLARE
  alvo oid := to_regclass('public.idx_health_snapshots_timestamp_desc');
  gemeo oid := to_regclass('public.idx_system_health_snapshots_timestamp');
  identico boolean;
BEGIN
  IF alvo IS NULL THEN
    RAISE NOTICE 'idx_health_snapshots_timestamp_desc ja nao existe: nada a fazer';
    RETURN;
  END IF;

  IF gemeo IS NULL THEN
    RAISE EXCEPTION 'o gemeo idx_system_health_snapshots_timestamp nao existe: nada foi dropado';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conindid IN (alvo, gemeo)) THEN
    RAISE EXCEPTION 'um dos indices sustenta constraint: nada foi dropado';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_index a
    JOIN pg_index b ON b.indexrelid = gemeo
    JOIN pg_class ca ON ca.oid = a.indexrelid
    JOIN pg_class cb ON cb.oid = b.indexrelid
    WHERE a.indexrelid = alvo
      AND a.indrelid = b.indrelid
      AND a.indkey::text = b.indkey::text
      AND a.indoption::text = b.indoption::text
      AND coalesce(a.indexprs::text, '') = coalesce(b.indexprs::text, '')
      AND coalesce(a.indpred::text, '') = coalesce(b.indpred::text, '')
      AND a.indclass::text = b.indclass::text
      AND a.indisunique = b.indisunique
      AND a.indisexclusion = b.indisexclusion
      AND coalesce(array_to_string(ca.reloptions, ','), '') = coalesce(array_to_string(cb.reloptions, ','), '')
  ) INTO identico;

  IF NOT identico THEN
    RAISE EXCEPTION 'os indices nao sao estruturalmente identicos: nada foi dropado';
  END IF;

  DROP INDEX public.idx_health_snapshots_timestamp_desc;
END;
$migration$;

COMMIT;

-- DOWN MIGRATION
-- Recria o indice exatamente como o catalogo o descrevia antes:
/*
BEGIN;
CREATE INDEX idx_health_snapshots_timestamp_desc
  ON public.system_health_snapshots USING btree ("timestamp" DESC);
COMMIT;
*/