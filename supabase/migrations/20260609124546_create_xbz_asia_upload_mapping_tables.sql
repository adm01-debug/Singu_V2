-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260609124546
-- nome:   create_xbz_asia_upload_mapping_tables

CREATE TABLE IF NOT EXISTS public.xbz_upload_mapping (
  id           bigserial PRIMARY KEY,
  request_id   bigint NOT NULL,
  staging_id   uuid,
  cf_custom_id text NOT NULL,
  source_url   text NOT NULL,
  status       text NOT NULL DEFAULT 'pending',
  harvested_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xbz_upload_mapping_request_id ON public.xbz_upload_mapping(request_id);
CREATE INDEX IF NOT EXISTS idx_xbz_upload_mapping_status     ON public.xbz_upload_mapping(status);
CREATE INDEX IF NOT EXISTS idx_xbz_upload_mapping_created_at ON public.xbz_upload_mapping(created_at);

CREATE TABLE IF NOT EXISTS public.asia_upload_mapping (
  id           bigserial PRIMARY KEY,
  request_id   bigint NOT NULL,
  queue_id     uuid,
  cf_custom_id text NOT NULL,
  source_url   text NOT NULL,
  status       text NOT NULL DEFAULT 'pending',
  harvested_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asia_upload_mapping_request_id ON public.asia_upload_mapping(request_id);
CREATE INDEX IF NOT EXISTS idx_asia_upload_mapping_status     ON public.asia_upload_mapping(status);

COMMENT ON TABLE public.xbz_upload_mapping IS 'Rastreia requisições pg_net para upload de imagens XBZ ao Cloudflare Images';
COMMENT ON TABLE public.asia_upload_mapping IS 'Rastreia requisições pg_net para upload de imagens Asia Import ao Cloudflare Images';
