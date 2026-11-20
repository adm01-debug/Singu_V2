-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121336
-- nome:   create_carrier_evaluations

CREATE TABLE carrier_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  avaliador_id integer NOT NULL REFERENCES users(id),
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  referencia text,
  -- 5 critérios específicos de transporte (D1)
  nota_pontualidade integer NOT NULL CHECK (nota_pontualidade >= 1 AND nota_pontualidade <= 5),
  nota_conservacao integer NOT NULL CHECK (nota_conservacao >= 1 AND nota_conservacao <= 5),
  nota_preco_frete integer NOT NULL CHECK (nota_preco_frete >= 1 AND nota_preco_frete <= 5),
  nota_rastreamento integer NOT NULL CHECK (nota_rastreamento >= 1 AND nota_rastreamento <= 5),
  nota_cobertura integer NOT NULL CHECK (nota_cobertura >= 1 AND nota_cobertura <= 5),
  -- Nota geral GENERATED (média simples das 5 notas, para referência rápida)
  nota_geral numeric(4,2) GENERATED ALWAYS AS (
    (nota_pontualidade + nota_conservacao + nota_preco_frete + nota_rastreamento + nota_cobertura)::numeric / 5.0
  ) STORED,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_carrier_evaluations_carrier ON carrier_evaluations(carrier_id);
CREATE INDEX idx_carrier_evaluations_carrier_data ON carrier_evaluations(carrier_id, data_avaliacao DESC);
CREATE INDEX idx_carrier_evaluations_data ON carrier_evaluations(data_avaliacao DESC);
CREATE INDEX idx_carrier_evaluations_avaliador ON carrier_evaluations(avaliador_id);

-- RLS
ALTER TABLE carrier_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carrier_evaluations_select" ON carrier_evaluations FOR SELECT USING (true);
CREATE POLICY "carrier_evaluations_insert" ON carrier_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "carrier_evaluations_update" ON carrier_evaluations FOR UPDATE USING (true);
CREATE POLICY "carrier_evaluations_delete" ON carrier_evaluations FOR DELETE USING (true);

COMMENT ON TABLE carrier_evaluations IS 'Avaliações de transportadoras. 5 critérios: pontualidade(30%), conservação(25%), preço_frete(20%), cobertura(15%), rastreamento(10%). Append-only (trigger bloqueia UPDATE).';
