-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329175403
-- nome:   create_supplier_evaluations

-- Tabela: Avaliações de fornecedores (por entrega ou período)
CREATE TABLE supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  avaliador_id INTEGER NOT NULL REFERENCES users(id),
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  referencia TEXT,
  nota_preco INTEGER NOT NULL CHECK (nota_preco BETWEEN 1 AND 5),
  nota_prazo INTEGER NOT NULL CHECK (nota_prazo BETWEEN 1 AND 5),
  nota_qualidade INTEGER NOT NULL CHECK (nota_qualidade BETWEEN 1 AND 5),
  nota_entrega INTEGER NOT NULL CHECK (nota_entrega BETWEEN 1 AND 5),
  nota_geral NUMERIC(4,2) GENERATED ALWAYS AS (
    (nota_preco + nota_prazo + nota_qualidade + nota_entrega)::numeric / 4.0
  ) STORED,
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supplier_evaluations_supplier ON supplier_evaluations(supplier_id);
CREATE INDEX idx_supplier_evaluations_avaliador ON supplier_evaluations(avaliador_id);
CREATE INDEX idx_supplier_evaluations_data ON supplier_evaluations(data_avaliacao DESC);
CREATE INDEX idx_supplier_evaluations_supplier_data ON supplier_evaluations(supplier_id, data_avaliacao DESC);

-- RLS
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_evaluations_select" ON supplier_evaluations FOR SELECT USING (true);
CREATE POLICY "supplier_evaluations_insert" ON supplier_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "supplier_evaluations_update" ON supplier_evaluations FOR UPDATE USING (true);
CREATE POLICY "supplier_evaluations_delete" ON supplier_evaluations FOR DELETE USING (true);
