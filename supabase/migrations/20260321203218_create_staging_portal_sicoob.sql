-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321203218
-- nome:   create_staging_portal_sicoob

CREATE TABLE IF NOT EXISTS staging_portal_sicoob (
  id SERIAL PRIMARY KEY,
  numero_cooperativa VARCHAR(10),
  num_pac VARCHAR(10),
  sigla VARCHAR(100),
  nome TEXT,
  tipo_unidade VARCHAR(20),
  endereco TEXT,
  numero VARCHAR(20),
  complemento TEXT,
  bairro VARCHAR(200),
  cidade VARCHAR(200),
  estado VARCHAR(2),
  cep VARCHAR(20),
  email VARCHAR(300),
  telefones JSONB,
  latitude VARCHAR(30),
  longitude VARCHAR(30),
  portal_id INTEGER,
  possui_atm BOOLEAN DEFAULT false,
  processado BOOLEAN DEFAULT false,
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_staging_portal_chave ON staging_portal_sicoob(numero_cooperativa, num_pac);
