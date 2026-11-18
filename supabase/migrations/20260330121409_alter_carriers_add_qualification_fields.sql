-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121409
-- nome:   alter_carriers_add_qualification_fields

-- Campos de cache (mesmo padrão de suppliers)
ALTER TABLE carriers ADD COLUMN homologado boolean NOT NULL DEFAULT false;
ALTER TABLE carriers ADD COLUMN data_homologacao date;
ALTER TABLE carriers ADD COLUMN score_geral numeric(5,2) CHECK (score_geral >= 0 AND score_geral <= 100);

-- Indexes para consultas frequentes
CREATE INDEX idx_carriers_homologado ON carriers(homologado);
CREATE INDEX idx_carriers_score_geral ON carriers(score_geral DESC);

COMMENT ON COLUMN carriers.homologado IS 'Flag de cache: true se última homologação está ativa e não vencida';
COMMENT ON COLUMN carriers.data_homologacao IS 'Cache da data da última homologação aprovada';
COMMENT ON COLUMN carriers.score_geral IS 'Cache do score geral consolidado (0-100)';
