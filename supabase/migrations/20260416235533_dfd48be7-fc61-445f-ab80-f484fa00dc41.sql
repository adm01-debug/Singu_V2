-- ============================================================
-- WIN/LOSS INTELLIGENCE — Schema
-- ============================================================

-- 1) Catálogo de motivos
CREATE TABLE public.win_loss_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('price','product','timing','relationship','competition','budget','authority','need','other')),
  label text NOT NULL,
  outcome_type text NOT NULL DEFAULT 'both' CHECK (outcome_type IN ('won','lost','both')),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, label)
);

CREATE INDEX IF NOT EXISTS idx_win_loss_reasons_user ON public.win_loss_reasons(user_id, active);

ALTER TABLE public.win_loss_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own reasons" ON public.win_loss_reasons
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_win_loss_reasons_updated
  BEFORE UPDATE ON public.win_loss_reasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Concorrentes
CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  website text,
  strengths text[] DEFAULT ARRAY[]::text[],
  weaknesses text[] DEFAULT ARRAY[]::text[],
  typical_price_range text,
  win_rate_against numeric(5,2) DEFAULT 0,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_competitors_user ON public.competitors(user_id, active);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own competitors" ON public.competitors
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_competitors_updated
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Registros Win/Loss
CREATE TABLE public.win_loss_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deal_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('won','lost','no_decision','pending')),
  primary_reason_id uuid REFERENCES public.win_loss_reasons(id) ON DELETE SET NULL,
  secondary_reasons text[] DEFAULT ARRAY[]::text[],
  competitor_id uuid REFERENCES public.competitors(id) ON DELETE SET NULL,
  deal_value numeric(14,2),
  sales_cycle_days integer,
  decision_maker_contact_id uuid,
  notes text,
  lessons_learned text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_win_loss_records_user_outcome ON public.win_loss_records(user_id, outcome, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_win_loss_records_competitor ON public.win_loss_records(competitor_id);
CREATE INDEX IF NOT EXISTS idx_win_loss_records_primary_reason ON public.win_loss_records(primary_reason_id);

ALTER TABLE public.win_loss_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own win_loss_records" ON public.win_loss_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_win_loss_records_updated
  BEFORE UPDATE ON public.win_loss_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_win_loss_records_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.win_loss_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- 4) Insights (cache de IA)
CREATE TABLE public.win_loss_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('pattern','recommendation','alert')),
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical','success')),
  supporting_data jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_win_loss_insights_user_generated ON public.win_loss_insights(user_id, generated_at DESC);

ALTER TABLE public.win_loss_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own insights" ON public.win_loss_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users insert own insights" ON public.win_loss_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own insights" ON public.win_loss_insights
  FOR DELETE USING (auth.uid() = user_id);

-- 5) Função de seed de razões padrão
CREATE OR REPLACE FUNCTION public.seed_win_loss_defaults(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.win_loss_reasons (user_id, category, label, outcome_type, sort_order) VALUES
    -- WON
    (_user_id, 'product', 'Melhor adequação técnica', 'won', 1),
    (_user_id, 'relationship', 'Relacionamento forte com decisor', 'won', 2),
    (_user_id, 'price', 'Melhor proposta comercial', 'won', 3),
    (_user_id, 'timing', 'Timing perfeito', 'won', 4),
    (_user_id, 'product', 'Diferencial competitivo claro', 'won', 5),
    (_user_id, 'relationship', 'Confiança no time de vendas', 'won', 6),
    -- LOST
    (_user_id, 'price', 'Preço acima do orçamento', 'lost', 10),
    (_user_id, 'competition', 'Concorrente escolhido', 'lost', 11),
    (_user_id, 'product', 'Faltou funcionalidade crítica', 'lost', 12),
    (_user_id, 'timing', 'Timing ruim / projeto adiado', 'lost', 13),
    (_user_id, 'budget', 'Sem budget aprovado', 'lost', 14),
    (_user_id, 'authority', 'Não falou com decisor real', 'lost', 15),
    (_user_id, 'need', 'Necessidade não confirmada', 'lost', 16),
    (_user_id, 'relationship', 'Relacionamento fraco', 'lost', 17),
    -- BOTH
    (_user_id, 'other', 'Indicação de cliente atual', 'both', 20),
    (_user_id, 'other', 'Inbound qualificado', 'both', 21),
    (_user_id, 'competition', 'Status quo / não fez nada', 'both', 22),
    (_user_id, 'other', 'Outro', 'both', 99)
  ON CONFLICT (user_id, category, label) DO NOTHING;
END;
$$;