-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121358
-- nome:   create_carrier_score_history

CREATE TABLE carrier_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  score_pontualidade numeric(5,2),
  score_conservacao numeric(5,2),
  score_preco_frete numeric(5,2),
  score_rastreamento numeric(5,2),
  score_cobertura numeric(5,2),
  score_geral numeric(5,2),
  previous_score numeric(5,2),
  score_change numeric(5,2),
  segment_code text,
  previous_segment text,
  segment_changed boolean DEFAULT false,
  trend text,
  change_reason text,
  measured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_carrier_score_history_carrier ON carrier_score_history(carrier_id, measured_at DESC);
CREATE INDEX idx_carrier_score_history_measured ON carrier_score_history(measured_at DESC);

-- RLS
ALTER TABLE carrier_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carrier_score_history_select" ON carrier_score_history FOR SELECT USING (true);
CREATE POLICY "carrier_score_history_insert" ON carrier_score_history FOR INSERT WITH CHECK (true);
CREATE POLICY "carrier_score_history_update" ON carrier_score_history FOR UPDATE USING (true);
CREATE POLICY "carrier_score_history_delete" ON carrier_score_history FOR DELETE USING (true);

COMMENT ON TABLE carrier_score_history IS 'Histórico append-only de evolução do score de transportadoras. Cada recálculo gera um registro.';
