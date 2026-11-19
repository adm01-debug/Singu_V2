-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220612
-- nome:   singu_create_vak_analysis_history

-- ============================================================================
-- SINGU — TABELA 6/9: vak_analysis_history
-- Padrão espelhado em disc_analysis_history + eq_analysis_history
-- VAK = Visual / Auditivo / Cinestésico (PNL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vak_analysis_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  -- Perfil dominante
  primary_modality character varying(1) NOT NULL CHECK (primary_modality IN ('V','A','K','D')),
  secondary_modality character varying(1) CHECK (secondary_modality IN ('V','A','K','D')),
  -- Scores por modalidade (0-100)
  visual_score integer NOT NULL DEFAULT 0 CHECK (visual_score BETWEEN 0 AND 100),
  auditory_score integer NOT NULL DEFAULT 0 CHECK (auditory_score BETWEEN 0 AND 100),
  kinesthetic_score integer NOT NULL DEFAULT 0 CHECK (kinesthetic_score BETWEEN 0 AND 100),
  digital_score integer DEFAULT 0 CHECK (digital_score BETWEEN 0 AND 100),
  confidence integer NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  -- Fonte e evidências
  analysis_source text NOT NULL DEFAULT 'manual' CHECK (analysis_source IN ('manual','ai_auto','keyword_match','voice_analysis','hybrid')),
  analyzed_text text,
  detected_keywords jsonb DEFAULT '[]'::jsonb,
  detected_phrases jsonb DEFAULT '[]'::jsonb,
  sensory_indicators jsonb DEFAULT '[]'::jsonb,
  -- Recomendações derivadas
  recommended_approach text,
  communication_tips jsonb DEFAULT '[]'::jsonb,
  profile_summary text,
  analysis_notes text,
  analyzed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.vak_analysis_history IS 'SINGU: Histórico de análises VAK (Visual/Auditivo/Cinestésico/Digital) por contato. Cada registro = 1 análise (manual, AI automática via keyword_match em vak_keywords, ou voice_analysis). Espelha o padrão de disc_analysis_history e eq_analysis_history.';

ALTER TABLE public.vak_analysis_history
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS interaction_id uuid,
  ADD COLUMN IF NOT EXISTS primary_modality character varying(1) NOT NULL CHECK (primary_modality IN ('V','A','K','D')),
  ADD COLUMN IF NOT EXISTS secondary_modality character varying(1) CHECK (secondary_modality IN ('V','A','K','D')),
  ADD COLUMN IF NOT EXISTS visual_score integer NOT NULL DEFAULT 0 CHECK (visual_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS auditory_score integer NOT NULL DEFAULT 0 CHECK (auditory_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS kinesthetic_score integer NOT NULL DEFAULT 0 CHECK (kinesthetic_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS digital_score integer DEFAULT 0 CHECK (digital_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS confidence integer NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS analysis_source text NOT NULL DEFAULT 'manual' CHECK (analysis_source IN ('manual','ai_auto','keyword_match','voice_analysis','hybrid')),
  ADD COLUMN IF NOT EXISTS analyzed_text text,
  ADD COLUMN IF NOT EXISTS detected_keywords jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS detected_phrases jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sensory_indicators jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recommended_approach text,
  ADD COLUMN IF NOT EXISTS communication_tips jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_summary text,
  ADD COLUMN IF NOT EXISTS analysis_notes text,
  ADD COLUMN IF NOT EXISTS analyzed_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();


CREATE INDEX IF NOT EXISTS idx_vak_analysis_history_contact ON public.vak_analysis_history (contact_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vak_analysis_history_user ON public.vak_analysis_history (user_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vak_analysis_history_interaction ON public.vak_analysis_history (interaction_id) WHERE interaction_id IS NOT NULL;

ALTER TABLE public.vak_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.vak_analysis_history FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.vak_analysis_history FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.vak_analysis_history FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.vak_analysis_history FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.vak_analysis_history FOR ALL TO service_role USING (true) WITH CHECK (true);

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=28;
