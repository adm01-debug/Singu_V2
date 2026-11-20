-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220553
-- nome:   singu_create_redistribution_log

-- ============================================================================
-- SINGU — TABELA 5/9: redistribution_log
-- "Auditoria de redistribuições com motivo"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.redistribution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  from_user_id uuid NOT NULL,
  to_user_id uuid,
  reason text NOT NULL CHECK (reason IN ('inactivity','vacation','cap_exceeded','manual','performance','territory_change','load_balance','other')),
  reason_details text,
  triggered_by text NOT NULL DEFAULT 'system' CHECK (triggered_by IN ('system','manager','admin','automation')),
  triggered_by_user uuid,
  previous_assignment_id uuid,
  new_assignment_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.redistribution_log IS 'SINGU: Log append-only de redistribuições de carteira. Cada linha = 1 transferência de lead de um vendedor para outro, com motivo (inatividade, férias, cap excedido, manual, etc). Base para auditoria e analytics de rotação.';

ALTER TABLE public.redistribution_log
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS from_user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS to_user_id uuid,
  ADD COLUMN IF NOT EXISTS reason text NOT NULL CHECK (reason IN ('inactivity','vacation','cap_exceeded','manual','performance','territory_change','load_balance','other')),
  ADD COLUMN IF NOT EXISTS reason_details text,
  ADD COLUMN IF NOT EXISTS triggered_by text NOT NULL DEFAULT 'system' CHECK (triggered_by IN ('system','manager','admin','automation')),
  ADD COLUMN IF NOT EXISTS triggered_by_user uuid,
  ADD COLUMN IF NOT EXISTS previous_assignment_id uuid,
  ADD COLUMN IF NOT EXISTS new_assignment_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();


CREATE INDEX IF NOT EXISTS idx_redistribution_log_user_created ON public.redistribution_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redistribution_log_contact ON public.redistribution_log (contact_id, created_at DESC) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_redistribution_log_from_to ON public.redistribution_log (from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_redistribution_log_reason ON public.redistribution_log (reason, created_at DESC);

ALTER TABLE public.redistribution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.redistribution_log FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.redistribution_log FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.redistribution_log FOR ALL TO service_role USING (true) WITH CHECK (true);

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=23;
