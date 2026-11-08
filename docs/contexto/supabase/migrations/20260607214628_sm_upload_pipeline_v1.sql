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
