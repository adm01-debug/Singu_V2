-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260314153642
-- nome:   create_stg_site_sicoob_pacs

CREATE TABLE IF NOT EXISTS stg_site_sicoob_pacs (
  id SERIAL PRIMARY KEY,
  nr INTEGER,
  cnpj_base TEXT,
  nome_cooperativa TEXT,
  nome_posto TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cep TEXT,
  municipio TEXT,
  uf TEXT,
  ddd TEXT,
  telefone TEXT,
  company_id UUID,
  match_status TEXT DEFAULT 'NEW'
);
