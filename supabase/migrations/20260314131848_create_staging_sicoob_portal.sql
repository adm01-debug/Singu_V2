-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260314131848
-- nome:   create_staging_sicoob_portal

CREATE TABLE IF NOT EXISTS stg_portal_sicoob (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  nr_coop varchar,
  tipo varchar,
  sigla varchar,
  nome_completo text,
  nr_pac varchar,
  logradouro varchar,
  numero varchar,
  complemento varchar,
  bairro varchar,
  cidade varchar,
  uf varchar(2),
  cep varchar,
  endereco_completo text,
  telefone_principal varchar,
  telefone_2 varchar,
  tipo_tel_1 varchar,
  tipo_tel_2 varchar,
  todos_telefones text,
  email varchar,
  site_sicoob varchar,
  latitude varchar,
  longitude varchar,
  google_maps_coordenadas text,
  google_maps_endereco text,
  possui_atm varchar,
  id_portal varchar,
  -- controle
  aba_origem varchar,
  processed boolean DEFAULT false,
  company_id uuid REFERENCES companies(id),
  match_status varchar DEFAULT 'NEW'
);

CREATE TABLE IF NOT EXISTS stg_bcb_sicoob (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  nr_ordem varchar,
  cnpj varchar,
  nome text,
  classe varchar,
  categoria varchar,
  filiacao text,
  endereco text,
  complemento varchar,
  bairro varchar,
  cep varchar,
  municipio varchar,
  uf varchar(2),
  ddd varchar,
  telefone varchar,
  email varchar,
  site varchar,
  -- controle
  processed boolean DEFAULT false,
  company_id uuid REFERENCES companies(id),
  match_status varchar DEFAULT 'NEW'
);
