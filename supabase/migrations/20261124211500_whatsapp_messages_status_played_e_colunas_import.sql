-- Alinha public.whatsapp_messages ao contrato ja declarado no repositorio.
--
-- 1) status 'played': o evolution-webhook grava 'played' nos acks do Evolution
--    (messages.ts, branch PLAYED) e _shared/evolution-dispatch-contract_test.ts
--    espera 'played' para o status 5. O check de producao so aceitava
--    pending/sent/delivered/read/failed, entao esse update falhava com 23514.
-- 2) duration_seconds e transcription_status: sao gravadas pelo whatsapp-import
--    (deployado e chamado pela rota /whatsapp/importar) e lidas pela UI, mas nao
--    existem em public.whatsapp_messages - o insert inteiro falha com 42703.
--
-- Idempotente: pode rodar mais de uma vez.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.whatsapp_messages'::regclass
       AND conname = 'whatsapp_messages_status_check'
  ) THEN
    ALTER TABLE public.whatsapp_messages DROP CONSTRAINT whatsapp_messages_status_check;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.whatsapp_messages'::regclass
       AND conname IN ('whatsapp_messages_status_check', 'chk_whatsapp_messages_status')
  ) THEN
    ALTER TABLE public.whatsapp_messages
      ADD CONSTRAINT whatsapp_messages_status_check
      CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'played', 'failed'));
  END IF;
END $$;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS transcription_status text;
