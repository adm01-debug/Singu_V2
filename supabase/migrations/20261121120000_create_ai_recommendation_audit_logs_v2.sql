-- [singu-idem] ai_recommendation_audit_logs_v2: espelha o schema que ja existe em producao
-- e e consumido por src/hooks/useRecommendationAudit.ts.
-- DDL idempotente: roda limpo mesmo com a tabela ja criada (gap repo<->producao).
CREATE TABLE IF NOT EXISTS public.ai_recommendation_audit_logs_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  score double precision,
  recommendation_type text NOT NULL,
  reasons text[],
  data_used jsonb,
  user_action text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.ai_recommendation_audit_logs_v2 IS
  E'Log de auditoria das recomendacoes de IA exibidas aos usuarios (v2).';

-- RLS: usuario so ve/edita os proprios registros.
ALTER TABLE public.ai_recommendation_audit_logs_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recommendation logs v2" ON public.ai_recommendation_audit_logs_v2;  -- [singu-idem]
CREATE POLICY "Users can view their own recommendation logs v2" ON public.ai_recommendation_audit_logs_v2
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own recommendation logs v2" ON public.ai_recommendation_audit_logs_v2;  -- [singu-idem]
CREATE POLICY "Users can create their own recommendation logs v2" ON public.ai_recommendation_audit_logs_v2
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recommendation logs v2" ON public.ai_recommendation_audit_logs_v2;  -- [singu-idem]
CREATE POLICY "Users can update their own recommendation logs v2" ON public.ai_recommendation_audit_logs_v2
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
