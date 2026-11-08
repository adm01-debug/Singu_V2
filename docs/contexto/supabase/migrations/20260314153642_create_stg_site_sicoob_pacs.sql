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
