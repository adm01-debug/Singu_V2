-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121348
-- nome:   create_carrier_scores

CREATE TABLE carrier_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL UNIQUE REFERENCES carriers(id) ON DELETE CASCADE,
  -- 5 scores individuais (0-100)
  score_pontualidade numeric(5,2) CHECK (score_pontualidade >= 0 AND score_pontualidade <= 100),
  score_conservacao numeric(5,2) CHECK (score_conservacao >= 0 AND score_conservacao <= 100),
  score_preco_frete numeric(5,2) CHECK (score_preco_frete >= 0 AND score_preco_frete <= 100),
  score_rastreamento numeric(5,2) CHECK (score_rastreamento >= 0 AND score_rastreamento <= 100),
  score_cobertura numeric(5,2) CHECK (score_cobertura >= 0 AND score_cobertura <= 100),
  -- Score consolidado
  score_geral numeric(5,2) CHECK (score_geral >= 0 AND score_geral <= 100),
  previous_score numeric(5,2),
  score_change numeric(5,2),
  -- Classificação
  segment_code text REFERENCES carrier_qualification_config(segment_code),
  classificacao text,
  total_avaliacoes integer NOT NULL DEFAULT 0,
  ultima_avaliacao date,
  trend text CHECK (trend IN ('melhorando', 'estavel', 'piorando')),
  calculated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_carrier_scores_score_geral ON carrier_scores(score_geral DESC);
CREATE INDEX idx_carrier_scores_segment ON carrier_scores(segment_code);
CREATE INDEX idx_carrier_scores_trend ON carrier_scores(trend);

-- RLS
ALTER TABLE carrier_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carrier_scores_select" ON carrier_scores FOR SELECT USING (true);
CREATE POLICY "carrier_scores_insert" ON carrier_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "carrier_scores_update" ON carrier_scores FOR UPDATE USING (true);
CREATE POLICY "carrier_scores_delete" ON carrier_scores FOR DELETE USING (true);

COMMENT ON TABLE carrier_scores IS 'Score consolidado de transportadoras (1 por carrier). Recalculado automaticamente via trigger após cada avaliação.';
