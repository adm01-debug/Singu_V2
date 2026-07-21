-- ============================================================================
-- migration_password_reset_log
-- ----------------------------------------------------------------------------
-- Log idempotente de envios de recovery-link pós-migração.
-- Executar no BANCO DE DESTINO antes do disparo em massa.
-- UNIQUE(user_id) garante que reruns pulem usuários já processados.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.migration_password_reset_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  email_hash   text NOT NULL,               -- sha256(lower(email)); nunca armazenar email cru
  status       text NOT NULL CHECK (status IN ('pending','sent','skipped','failed')),
  attempts     int  NOT NULL DEFAULT 0,
  error_code   text,
  error_message text,
  provider     text,                        -- 'email' | 'google' | 'apple' | ...
  sent_at      timestamptz,
  completed_at timestamptz,                 -- preenchido quando o usuário efetivamente resetar
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT migration_password_reset_log_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_mprl_status      ON public.migration_password_reset_log (status);
CREATE INDEX IF NOT EXISTS idx_mprl_sent_at     ON public.migration_password_reset_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_mprl_completed   ON public.migration_password_reset_log (completed_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.migration_password_reset_log TO authenticated;
GRANT ALL                    ON public.migration_password_reset_log TO service_role;

ALTER TABLE public.migration_password_reset_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler o log; escrita fica reservada ao service_role.
CREATE POLICY "mprl_admin_read"
  ON public.migration_password_reset_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.tg_mprl_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mprl_touch ON public.migration_password_reset_log;
CREATE TRIGGER trg_mprl_touch
  BEFORE UPDATE ON public.migration_password_reset_log
  FOR EACH ROW EXECUTE FUNCTION public.tg_mprl_touch_updated_at();