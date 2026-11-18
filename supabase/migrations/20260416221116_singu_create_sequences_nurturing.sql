-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221116
-- nome:   singu_create_sequences_nurturing

-- ============================================================================
-- SINGU — MÓDULO SEQUÊNCIAS & NURTURING (5 tabelas)
-- Spec: memory features/sequences-multichannel
-- "Cadências automáticas Email/WhatsApp/Call com steps, pause-on-reply e enrollments"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  sequence_type text NOT NULL DEFAULT 'outbound' CHECK (sequence_type IN ('outbound','inbound','reengagement','onboarding','custom')),
  is_active boolean DEFAULT true,
  pause_on_reply boolean DEFAULT true,
  pause_on_meeting_booked boolean DEFAULT true,
  total_steps integer DEFAULT 0,
  total_enrolled integer DEFAULT 0,
  completion_rate numeric(5,2),
  reply_rate numeric(5,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sequences IS 'SINGU: Sequências (cadências) multi-canal de contato. Mãe dos steps individuais em sequence_steps.';

CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  user_id uuid NOT NULL,
  step_number integer NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp','sms','call','linkedin','task','wait')),
  delay_days integer DEFAULT 0,
  delay_hours integer DEFAULT 0,
  subject text,
  body text,
  template_id uuid,
  conditions jsonb DEFAULT '{}'::jsonb,
  actions_on_complete jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_step_per_sequence UNIQUE (sequence_id, step_number)
);
COMMENT ON TABLE public.sequence_steps IS 'SINGU: Passos individuais de uma sequência. Ordem via step_number. Delay em dias+horas. Canal: email/whatsapp/sms/call/linkedin/task/wait.';

CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled','failed','replied','meeting_booked')),
  current_step integer DEFAULT 0,
  next_step_at timestamp with time zone,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  paused_at timestamp with time zone,
  paused_reason text,
  last_step_completed_at timestamp with time zone,
  reply_detected_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_enrollment UNIQUE (sequence_id, contact_id)
);
COMMENT ON TABLE public.sequence_enrollments IS 'SINGU: Matrículas de contatos em sequências. Pause automático on reply / on meeting_booked. 1 por contato por sequência (unique).';

CREATE TABLE IF NOT EXISTS public.nurturing_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('score_change','segment_change','inactivity','event','manual','custom')),
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  workflow_steps jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  total_enrolled integer DEFAULT 0,
  success_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.nurturing_workflows IS 'SINGU: Fluxos de nutrição long-term (mais complexos que sequences). Trigger-based (score/segment/inactivity/event).';

CREATE TABLE IF NOT EXISTS public.nurturing_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled','failed')),
  current_step_index integer DEFAULT 0,
  context jsonb DEFAULT '{}'::jsonb,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.nurturing_enrollments IS 'SINGU: Contatos em workflows de nurturing. Context carrega estado entre steps.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sequences_user_active ON public.sequences (user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sequence_steps_seq ON public.sequence_steps (sequence_id, step_number);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_user_status ON public.sequence_enrollments (user_id, status);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_contact ON public.sequence_enrollments (contact_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next_step ON public.sequence_enrollments (next_step_at) WHERE status='active' AND next_step_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nurturing_workflows_user_active ON public.nurturing_workflows (user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_nurturing_enrollments_active ON public.nurturing_enrollments (user_id, status, workflow_id) WHERE status='active';

-- RLS padrão SINGU
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['sequences','sequence_steps','sequence_enrollments','nurturing_workflows','nurturing_enrollments'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Users can view own" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can insert own" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can update own" ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can delete own" ON public.%I FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "service_role_full" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='updated_at') THEN
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END IF;
  END LOOP;
END $$;
