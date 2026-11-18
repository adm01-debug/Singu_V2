-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20261118181543
-- nome:   incoming_webhook_nonces

CREATE TABLE IF NOT EXISTS public.incoming_webhook_nonces (
  webhook_id uuid NOT NULL REFERENCES public.incoming_webhooks(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (webhook_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_incoming_webhook_nonces_expires_at
  ON public.incoming_webhook_nonces (expires_at);

ALTER TABLE public.incoming_webhook_nonces ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.incoming_webhook_nonces FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.incoming_webhook_nonces TO service_role;
