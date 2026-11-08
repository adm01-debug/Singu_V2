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
