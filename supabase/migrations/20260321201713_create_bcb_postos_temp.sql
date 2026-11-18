-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321201713
-- nome:   create_bcb_postos_temp

CREATE TABLE IF NOT EXISTS _bcb_postos_temp (
  cnpj_base varchar,
  municipio varchar,
  uf varchar(2),
  nome_posto varchar,
  endereco varchar,
  numero varchar,
  bairro varchar,
  cep varchar,
  ddd varchar,
  telefone varchar,
  ibge varchar
);
