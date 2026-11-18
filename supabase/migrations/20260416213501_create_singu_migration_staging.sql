-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416213501
-- nome:   create_singu_migration_staging

-- Schema de staging para migração SINGU → bancodadosclientes
-- Criado em 2026-04-16
CREATE SCHEMA IF NOT EXISTS singu_migration;

COMMENT ON SCHEMA singu_migration IS 
'Schema temporário para migração do banco SINGU (rqodmqosrotmtrjnnjul / Lovable Cloud) para o banco oficial. Criado em 2026-04-16. Remover após validação.';

-- Tabela de controle/checklist da migração
CREATE TABLE IF NOT EXISTS singu_migration._checklist (
  id serial PRIMARY KEY,
  step_number int NOT NULL,
  step_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','skipped','error')),
  source_rows int,
  target_rows int,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE singu_migration._checklist IS 'Controle de progresso da migração SINGU. Cada linha = 1 tabela ou 1 operação estrutural.';

-- Tabela de log de erros
CREATE TABLE IF NOT EXISTS singu_migration._errors (
  id serial PRIMARY KEY,
  table_name text,
  chunk_number int,
  error_message text,
  sql_preview text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de schema capturado do origem (cache)
CREATE TABLE IF NOT EXISTS singu_migration._source_schema (
  table_name text PRIMARY KEY,
  columns_json jsonb,
  primary_keys jsonb,
  foreign_keys jsonb,
  row_count int,
  captured_at timestamptz DEFAULT now()
);

COMMENT ON TABLE singu_migration._source_schema IS 'Cache do schema capturado do banco SINGU origem. Populado via chat Lovable + colagem manual.';
