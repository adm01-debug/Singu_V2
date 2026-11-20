-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321191111
-- nome:   create_data_quality_audits

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
