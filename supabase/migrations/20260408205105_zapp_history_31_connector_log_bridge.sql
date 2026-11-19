-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408205105
-- nome:   zapp_history_31_connector_log_bridge

-- ============================================================================
-- MELHORIA 31: Cria public.connector_log (que a edge function evolution-bitrix-connector
-- já tenta usar via INSERT silencioso) + trigger que parseia e popula zapp_history.
-- Isso liga o pipeline operacional INTEIRO sem deploy de edge function.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connector_log (
  id BIGSERIAL PRIMARY KEY,
  direction TEXT NOT NULL,                        -- inbound | outbound | open-chat
  whatsapp_number TEXT,
  push_name TEXT,
  message_text TEXT,
  bitrix_response JSONB,
  evolution_response JSONB,
  raw_payload JSONB,                              -- payload completo Evolution (extensão)
  processed BOOLEAN NOT NULL DEFAULT FALSE,       -- flag pra trigger
  zapp_message_id UUID,                           -- referência pro registro criado em zapp_history.messages
  parse_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.connector_log
  ADD COLUMN IF NOT EXISTS raw_payload JSONB,
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS zapp_message_id UUID,
  ADD COLUMN IF NOT EXISTS parse_error TEXT;

CREATE INDEX IF NOT EXISTS idx_cl_created ON public.connector_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cl_direction ON public.connector_log(direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cl_phone ON public.connector_log(whatsapp_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cl_unprocessed ON public.connector_log(created_at) WHERE processed = FALSE;

-- service_role escreve, anon nada, authenticated lê (filtrado por contato dele)
ALTER TABLE public.connector_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cl_service_all ON public.connector_log;
CREATE POLICY cl_service_all ON public.connector_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS cl_admin_read ON public.connector_log;
CREATE POLICY cl_admin_read ON public.connector_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid())
  );

GRANT INSERT ON public.connector_log TO service_role;
GRANT SELECT ON public.connector_log TO authenticated;

COMMENT ON TABLE public.connector_log IS
  'Log de cada chamada do evolution-bitrix-connector. Preexistia como referência sem tabela criada — agora existe e dispara trigger que popula zapp_history.';
