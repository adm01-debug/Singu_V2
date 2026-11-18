-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321192746
-- nome:   optimize_companies_indexes

-- A1: Otimizar índices de companies (18→16)
-- Drop idx_companies_status: 0 scans, 1.8MB, partial index em coluna com baixa seletividade
DROP INDEX IF EXISTS idx_companies_status;

-- Documentar o GIN search que fica (14MB — infraestrutura para full-text search futuro)
COMMENT ON INDEX idx_companies_search IS 
  'GIN index para full-text search via search_vector. Mantido como infraestrutura — 0 scans atual, mas essencial quando search_companies() for chamada via frontend. NÃO dropar.';
