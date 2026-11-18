-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329175349
-- nome:   create_supplier_homologation_status_enum_and_table

-- Enum: status de homologação
CREATE TYPE supplier_homologation_status AS ENUM (
  'pendente',
  'em_analise',
  'homologado',
  'reprovado',
  'suspenso',
  'vencido'
);

-- Enum: severidade de alerta de fornecedor
CREATE TYPE supplier_alert_severity AS ENUM (
  'info',
  'atencao',
  'critico'
);

-- Tabela: Homologação de fornecedores pelo Depto de Compras
CREATE TABLE supplier_homologations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status supplier_homologation_status NOT NULL DEFAULT 'pendente',
  avaliador_id INTEGER REFERENCES users(id),
  data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_decisao TIMESTAMPTZ,
  validade DATE,
  criterios_checados JSONB DEFAULT '{}',
  motivo_reprovacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supplier_homologations_supplier ON supplier_homologations(supplier_id);
CREATE INDEX idx_supplier_homologations_status ON supplier_homologations(status);
CREATE INDEX idx_supplier_homologations_avaliador ON supplier_homologations(avaliador_id);
CREATE INDEX idx_supplier_homologations_validade ON supplier_homologations(validade);

-- Trigger updated_at
CREATE TRIGGER trg_supplier_homologations_updated_at
  BEFORE UPDATE ON supplier_homologations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (mesmo padrão aberto do suppliers)
ALTER TABLE supplier_homologations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_homologations_select" ON supplier_homologations FOR SELECT USING (true);
CREATE POLICY "supplier_homologations_insert" ON supplier_homologations FOR INSERT WITH CHECK (true);
CREATE POLICY "supplier_homologations_update" ON supplier_homologations FOR UPDATE USING (true);
CREATE POLICY "supplier_homologations_delete" ON supplier_homologations FOR DELETE USING (true);
