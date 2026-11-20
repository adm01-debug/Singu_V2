-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20261118181554
-- nome:   harden_incoming_webhooks_signature

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
