-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260313143911
-- nome:   create_staging_bitrix_companies

CREATE TABLE staging_bitrix_companies (
  bitrix_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  web TEXT,
  extracted_at TIMESTAMPTZ DEFAULT NOW()
);
