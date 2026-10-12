-- A reserva única antecede o envio; entregas sem confirmação não são repetidas automaticamente.
ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'sent';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.notification_logs'::regclass
      AND conname = 'notification_logs_delivery_status_check'
  ) THEN
    ALTER TABLE public.notification_logs
      ADD CONSTRAINT notification_logs_delivery_status_check
      CHECK (delivery_status IN ('pending', 'sent', 'unknown'));
  END IF;
END $$;

-- DOWN MIGRATION (Rollback): interrompa smart-notify antes de reverter o handler.
-- Preserve os marcadores pending/unknown: a ausência de confirmação não prova que a mensagem não foi entregue.
-- ALTER TABLE public.notification_logs DROP CONSTRAINT IF EXISTS notification_logs_delivery_status_check;
-- ALTER TABLE public.notification_logs DROP COLUMN IF EXISTS delivery_status;
