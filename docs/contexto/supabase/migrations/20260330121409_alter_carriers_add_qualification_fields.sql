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
