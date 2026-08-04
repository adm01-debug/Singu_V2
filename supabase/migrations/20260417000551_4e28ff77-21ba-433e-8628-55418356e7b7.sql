-- 1. conversation_analyses
CREATE TABLE public.conversation_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID,
  duration_seconds INTEGER,
  talk_ratio_rep NUMERIC(5,2),
  talk_ratio_customer NUMERIC(5,2),
  longest_monologue_seconds INTEGER,
  questions_asked INTEGER DEFAULT 0,
  sentiment_overall TEXT CHECK (sentiment_overall IN ('positive','neutral','negative','mixed')),
  sentiment_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  objections JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_moments JSONB NOT NULL DEFAULT '[]'::jsonb,
  coaching_score INTEGER CHECK (coaching_score BETWEEN 0 AND 100),
  coaching_tips TEXT[] NOT NULL DEFAULT '{}',
  next_best_action TEXT,
  model_used TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, interaction_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_analyses_user ON public.conversation_analyses(user_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_analyses_contact ON public.conversation_analyses(contact_id);
CREATE INDEX IF NOT EXISTS idx_conv_analyses_score ON public.conversation_analyses(user_id, coaching_score DESC);

ALTER TABLE public.conversation_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_analyses_select_own" ON public.conversation_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conv_analyses_insert_own" ON public.conversation_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conv_analyses_update_own" ON public.conversation_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "conv_analyses_delete_own" ON public.conversation_analyses FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_conv_analyses_updated_at
  BEFORE UPDATE ON public.conversation_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_conv_analyses_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.conversation_analyses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- 2. conversation_topics_catalog
CREATE TABLE public.conversation_topics_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('product','pricing','competition','objection','closing','discovery','other')),
  keywords TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_key)
);

CREATE INDEX IF NOT EXISTS idx_conv_topics_user ON public.conversation_topics_catalog(user_id, active, category);

ALTER TABLE public.conversation_topics_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_topics_select_own" ON public.conversation_topics_catalog FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conv_topics_insert_own" ON public.conversation_topics_catalog FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conv_topics_update_own" ON public.conversation_topics_catalog FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "conv_topics_delete_own" ON public.conversation_topics_catalog FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_conv_topics_updated_at
  BEFORE UPDATE ON public.conversation_topics_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. coaching_scorecards
CREATE TABLE public.coaching_scorecards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_scorecards_user ON public.coaching_scorecards(user_id, active);

ALTER TABLE public.coaching_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaching_scorecards_select_own" ON public.coaching_scorecards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coaching_scorecards_insert_own" ON public.coaching_scorecards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coaching_scorecards_update_own" ON public.coaching_scorecards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "coaching_scorecards_delete_own" ON public.coaching_scorecards FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_coaching_scorecards_updated_at
  BEFORE UPDATE ON public.coaching_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. seed function
CREATE OR REPLACE FUNCTION public.seed_conversation_topics(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.conversation_topics_catalog (user_id, topic_key, label, category, keywords, sort_order) VALUES
    (_user_id, 'pricing_discussion', 'Discussão de Preço', 'pricing', ARRAY['preço','valor','custo','investimento','desconto','orçamento'], 1),
    (_user_id, 'roi_value', 'ROI / Valor', 'pricing', ARRAY['roi','retorno','payback','economia','benefício'], 2),
    (_user_id, 'competitor_mention', 'Menção a Concorrente', 'competition', ARRAY['concorrente','competidor','outra opção','comparar','versus'], 3),
    (_user_id, 'product_features', 'Funcionalidades do Produto', 'product', ARRAY['funcionalidade','feature','recurso','como funciona','demo'], 4),
    (_user_id, 'integration_concerns', 'Preocupações de Integração', 'product', ARRAY['integração','integrar','api','sistema atual','migração'], 5),
    (_user_id, 'timing_urgency', 'Timing e Urgência', 'discovery', ARRAY['quando','prazo','urgente','data','cronograma'], 6),
    (_user_id, 'budget_authority', 'Budget e Autoridade', 'discovery', ARRAY['budget','aprovação','decisor','quem decide','board'], 7),
    (_user_id, 'pain_points', 'Dores e Problemas', 'discovery', ARRAY['problema','dor','desafio','dificuldade','frustração'], 8),
    (_user_id, 'objection_price', 'Objeção: Preço Alto', 'objection', ARRAY['caro','alto','não cabe','muito dinheiro'], 9),
    (_user_id, 'objection_timing', 'Objeção: Não é o Momento', 'objection', ARRAY['agora não','depois','outro momento','adiar'], 10),
    (_user_id, 'next_steps', 'Próximos Passos', 'closing', ARRAY['próximo passo','enviar proposta','agendar','follow up'], 11),
    (_user_id, 'commitment_close', 'Pedido de Compromisso', 'closing', ARRAY['fechamos','vamos seguir','assinar','contrato'], 12)
  ON CONFLICT (user_id, topic_key) DO NOTHING;
END;
$$;