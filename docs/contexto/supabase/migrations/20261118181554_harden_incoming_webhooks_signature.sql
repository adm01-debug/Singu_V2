UPDATE public.incoming_webhooks
SET is_active = false
WHERE webhook_secret IS NULL
   OR length(webhook_secret) < 32
   OR require_signature = false;

ALTER TABLE public.incoming_webhooks
  ALTER COLUMN require_signature SET DEFAULT true;

ALTER TABLE public.incoming_webhooks
  DROP CONSTRAINT IF EXISTS incoming_webhooks_active_signature_check;

ALTER TABLE public.incoming_webhooks
  ADD CONSTRAINT incoming_webhooks_active_signature_check
  CHECK (
    NOT is_active
    OR (
      require_signature
      AND webhook_secret IS NOT NULL
      AND length(webhook_secret) >= 32
    )
  );
