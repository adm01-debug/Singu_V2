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
