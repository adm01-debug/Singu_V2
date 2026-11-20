-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329175425
-- nome:   create_supplier_scores_and_qualification_config

-- Tabela: Configuração de segmentos de qualificação (padrão rfm_segment_config)
CREATE TABLE supplier_qualification_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_code TEXT NOT NULL UNIQUE,
  name_pt TEXT NOT NULL,
  description_pt TEXT,
  score_min NUMERIC(5,2) NOT NULL,
  score_max NUMERIC(5,2) NOT NULL,
  color TEXT,
  icon TEXT,
  priority INTEGER NOT NULL,
  recommended_actions_pt TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE TRIGGER trg_supplier_qualification_config_updated_at
  BEFORE UPDATE ON supplier_qualification_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: segmentos padrão
INSERT INTO supplier_qualification_config (segment_code, name_pt, description_pt, score_min, score_max, color, priority, recommended_actions_pt) VALUES
  ('excelente',   'Excelente',   'Fornecedor de alta performance consistente',      80.01, 100.00, '#4CAF50', 1, ARRAY['Priorizar pedidos','Negociar exclusividade','Ampliar mix de produtos']),
  ('bom',         'Bom',         'Fornecedor confiável com oportunidades de melhoria', 60.01, 80.00, '#8BC34A', 2, ARRAY['Manter relação','Monitorar prazos','Renegociar preços periodicamente']),
  ('regular',     'Regular',     'Fornecedor aceitável mas com pontos de atenção',   40.01, 60.00, '#FFC107', 3, ARRAY['Acompanhar de perto','Buscar alternativas','Exigir melhorias']),
  ('insuficiente','Insuficiente', 'Fornecedor abaixo do esperado',                  20.01, 40.00, '#FF5722', 4, ARRAY['Notificar fornecedor','Reduzir volume','Buscar substitutos']),
  ('critico',     'Crítico',     'Fornecedor com risco de descontinuação',            0.00, 20.00, '#F44336', 5, ARRAY['Suspender novos pedidos','Iniciar substituição','Reavaliar homologação']);

-- Tabela: Score consolidado por fornecedor
CREATE TABLE supplier_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL UNIQUE REFERENCES suppliers(id) ON DELETE CASCADE,
  score_preco NUMERIC(5,2),
  score_prazo NUMERIC(5,2),
  score_qualidade NUMERIC(5,2),
  score_entrega NUMERIC(5,2),
  score_geral NUMERIC(5,2),
  previous_score NUMERIC(5,2),
  score_change NUMERIC(5,2),
  segment_code TEXT REFERENCES supplier_qualification_config(segment_code),
  classificacao TEXT,
  total_avaliacoes INTEGER NOT NULL DEFAULT 0,
  ultima_avaliacao DATE,
  trend TEXT CHECK (trend IN ('melhorando','estavel','piorando')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supplier_scores_score_geral ON supplier_scores(score_geral DESC);
CREATE INDEX idx_supplier_scores_segment ON supplier_scores(segment_code);
CREATE INDEX idx_supplier_scores_trend ON supplier_scores(trend);

-- Trigger updated_at
CREATE TRIGGER trg_supplier_scores_updated_at
  BEFORE UPDATE ON supplier_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE supplier_qualification_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sqc_select" ON supplier_qualification_config FOR SELECT USING (true);
CREATE POLICY "sqc_insert" ON supplier_qualification_config FOR INSERT WITH CHECK (true);
CREATE POLICY "sqc_update" ON supplier_qualification_config FOR UPDATE USING (true);
CREATE POLICY "sqc_delete" ON supplier_qualification_config FOR DELETE USING (true);

ALTER TABLE supplier_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_scores_select" ON supplier_scores FOR SELECT USING (true);
CREATE POLICY "supplier_scores_insert" ON supplier_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "supplier_scores_update" ON supplier_scores FOR UPDATE USING (true);
CREATE POLICY "supplier_scores_delete" ON supplier_scores FOR DELETE USING (true);
