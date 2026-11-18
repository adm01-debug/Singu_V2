-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220628
-- nome:   singu_create_trigger_intensity_history

-- ============================================================================
-- SINGU — TABELA 7/9: trigger_intensity_history
-- Padrão baseado em trigger_usage_history + trigger_types (default_intensity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trigger_intensity_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  trigger_type_id uuid,
  trigger_bundle_id uuid,
  -- Intensidade usada (1=fraca, 5=muito forte) — calibra escalação progressiva
  intensity_level integer NOT NULL CHECK (intensity_level BETWEEN 1 AND 5),
  previous_intensity integer CHECK (previous_intensity BETWEEN 1 AND 5),
  intensity_change integer GENERATED ALWAYS AS (intensity_level - COALESCE(previous_intensity, intensity_level)) STORED,
  -- Contexto e efetividade
  channel text NOT NULL,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  response_received boolean DEFAULT false,
  response_sentiment text CHECK (response_sentiment IN ('positive','neutral','negative','hostile')),
  conversion boolean DEFAULT false,
  effectiveness_score numeric(5,2),
  -- Flags de escalação
  is_escalation boolean GENERATED ALWAYS AS (COALESCE(previous_intensity, 0) < intensity_level) STORED,
  reached_max_intensity boolean GENERATED ALWAYS AS (intensity_level = 5) STORED,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trigger_intensity_history IS 'SINGU: Histórico temporal de intensidade dos gatilhos mentais aplicados por contato. Trackeia escalação progressiva (1-5) para analytics de quais níveis converteram. Append-only. is_escalation e reached_max_intensity são computed.';

CREATE INDEX IF NOT EXISTS idx_trigger_intensity_contact ON public.trigger_intensity_history (contact_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_user ON public.trigger_intensity_history (user_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_type ON public.trigger_intensity_history (trigger_type_id, intensity_level);
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_conversions ON public.trigger_intensity_history (conversion, intensity_level) WHERE conversion = true;

ALTER TABLE public.trigger_intensity_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.trigger_intensity_history FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.trigger_intensity_history FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.trigger_intensity_history FOR ALL TO service_role USING (true) WITH CHECK (true);

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=26;
