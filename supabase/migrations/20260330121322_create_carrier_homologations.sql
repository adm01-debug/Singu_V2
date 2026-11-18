-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121322
-- nome:   create_carrier_homologations

CREATE TABLE carrier_homologations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  status carrier_homologation_status NOT NULL DEFAULT 'pendente',
  avaliador_id integer REFERENCES users(id),
  data_solicitacao timestamptz NOT NULL DEFAULT now(),
  data_decisao timestamptz,
  validade date,
  criterios_checados jsonb DEFAULT '{}'::jsonb,
  motivo_reprovacao text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes (espelho de supplier_homologations)
CREATE INDEX idx_carrier_homologations_carrier ON carrier_homologations(carrier_id);
CREATE INDEX idx_carrier_homologations_carrier_created ON carrier_homologations(carrier_id, created_at DESC);
CREATE INDEX idx_carrier_homologations_status ON carrier_homologations(status);
CREATE INDEX idx_carrier_homologations_avaliador ON carrier_homologations(avaliador_id);
CREATE INDEX idx_carrier_homologations_validade ON carrier_homologations(validade);

-- RLS
ALTER TABLE carrier_homologations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carrier_homologations_select" ON carrier_homologations FOR SELECT USING (true);
CREATE POLICY "carrier_homologations_insert" ON carrier_homologations FOR INSERT WITH CHECK (true);
CREATE POLICY "carrier_homologations_update" ON carrier_homologations FOR UPDATE USING (true);
CREATE POLICY "carrier_homologations_delete" ON carrier_homologations FOR DELETE USING (true);

COMMENT ON TABLE carrier_homologations IS 'Histórico de homologação de transportadoras. Avaliador = Coordenador de Logística (Thiago, id=80)';
