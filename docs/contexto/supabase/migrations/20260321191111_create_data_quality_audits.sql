-- Tabela de registro de auditorias de qualidade de dados
CREATE TABLE IF NOT EXISTS data_quality_audits (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  sistema varchar NOT NULL,              -- Ex: 'CRESOL', 'SICOOB', 'SICREDI'
  nivel varchar NOT NULL,                -- Ex: 'CONFEDERACAO', 'CENTRAL', 'SINGULAR', 'PAC'
  total_entidades int NOT NULL,
  campos_auditados jsonb NOT NULL,       -- { "campo": "status", ... }
  cobertura_percentual numeric(5,2),     -- % geral de preenchimento
  fonte_dados jsonb,                     -- ["BCB", "Receita Federal", "Site Cresol", ...]
  observacoes text,
  pendencias text,
  auditado_por varchar DEFAULT 'Claude AI',
  data_auditoria timestamptz DEFAULT now(),
  proxima_auditoria date,
  status varchar DEFAULT 'CONCLUIDO',    -- CONCLUIDO, PENDENTE, EM_ANDAMENTO
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE data_quality_audits IS 'Registro permanente de auditorias de qualidade de dados por sistema cooperativo';
COMMENT ON COLUMN data_quality_audits.campos_auditados IS 'JSON com status de cada campo: {"nome_crm": "58/58", "cnpj": "58/58", ...}';
