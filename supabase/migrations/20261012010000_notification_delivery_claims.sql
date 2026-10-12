-- A reserva única antecede o envio; entregas sem confirmação não são repetidas automaticamente.
ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_token uuid;

UPDATE public.notification_logs SET claim_expires_at = now()
WHERE delivery_status = 'pending' AND claim_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS notification_logs_pending_expiration_idx
  ON public.notification_logs(claim_expires_at) WHERE delivery_status = 'pending';

ALTER TABLE public.notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_delivery_status_check;
ALTER TABLE public.notification_logs
  ADD CONSTRAINT notification_logs_delivery_status_check
  CHECK (delivery_status IN ('pending', 'sent', 'unknown', 'rejected'));

-- DOWN MIGRATION (Rollback): interrompa smart-notify antes de reverter o handler.
-- Preserve os marcadores pending/unknown: a ausência de confirmação não prova que a mensagem não foi entregue.
-- ALTER TABLE public.notification_logs DROP CONSTRAINT IF EXISTS notification_logs_delivery_status_check;
-- ALTER TABLE public.notification_logs DROP COLUMN IF EXISTS delivery_status;
-- Preserve também claim_expires_at, claim_token e o índice enquanto houver entregas sem confirmação.
