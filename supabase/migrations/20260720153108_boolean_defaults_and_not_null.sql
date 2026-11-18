-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260720153108
-- nome:   boolean_defaults_and_not_null

-- Migration: DEFAULT false + NOT NULL on nullable boolean columns in base tables
-- Prevents 3-value logic bugs (WHERE col = true misses NULL rows in Postgres).
-- trigger_intensity_history boolean cols are GENERATED columns — skip those.
-- interactions.follow_up_required: 10,461 rows, 0 NULLs, all false.

ALTER TABLE public.interactions
  ALTER COLUMN follow_up_required SET DEFAULT false,
  ALTER COLUMN follow_up_required SET NOT NULL;
