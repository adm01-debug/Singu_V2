-- Enums
DO $$ BEGIN
  CREATE TYPE public.validation_kind AS ENUM ('email', 'phone');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.validation_queue_status AS ENUM ('pending', 'processing', 'done', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela
CREATE TABLE IF NOT EXISTS public.validation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NULL,
  kind public.validation_kind NOT NULL,
  value TEXT NOT NULL,
  status public.validation_queue_status NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_validation_queue_status_created
  ON public.validation_queue (status, created_at);
CREATE INDEX IF NOT EXISTS idx_validation_queue_contact
  ON public.validation_queue (contact_id);
CREATE INDEX IF NOT EXISTS idx_validation_queue_user
  ON public.validation_queue (user_id);

-- RLS
ALTER TABLE public.validation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users view own validation queue" ON public.validation_queue;
CREATE POLICY "users view own validation queue"
  ON public.validation_queue FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users insert own validation queue" ON public.validation_queue;
CREATE POLICY "users insert own validation queue"
  ON public.validation_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own validation queue" ON public.validation_queue;
CREATE POLICY "users update own validation queue"
  ON public.validation_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger function: enfileira email/phone quando contato é criado ou atualizado
CREATE OR REPLACE FUNCTION public.enqueue_contact_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Email
  IF NEW.email IS NOT NULL AND length(trim(NEW.email)) > 3 THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.email IS DISTINCT FROM OLD.email) THEN
      INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
      VALUES (NEW.user_id, NEW.id, 'email', NEW.email);
    END IF;
  END IF;

  -- Phone
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) >= 5 THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.phone IS DISTINCT FROM OLD.phone) THEN
      INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
      VALUES (NEW.user_id, NEW.id, 'phone', NEW.phone);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_contact_validation ON public.contacts;
CREATE TRIGGER trg_enqueue_contact_validation
  AFTER INSERT OR UPDATE OF email, phone ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_contact_validation();
