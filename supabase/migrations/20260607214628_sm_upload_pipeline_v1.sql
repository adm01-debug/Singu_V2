-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260607214628
-- nome:   sm_upload_pipeline_v1

-- Tabela permanente para mapear request_id pg_net → staging row
CREATE TABLE IF NOT EXISTS sm_upload_mapping (
  request_id bigint PRIMARY KEY,
  staging_id uuid NOT NULL,
  cf_custom_id text NOT NULL,
  source_url text NOT NULL,
  dispatched_at timestamptz NOT NULL DEFAULT NOW(),
  harvested_at timestamptz,
  status text DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS idx_sm_upload_mapping_status ON sm_upload_mapping(status);
CREATE INDEX IF NOT EXISTS idx_sm_upload_mapping_staging ON sm_upload_mapping(staging_id);
