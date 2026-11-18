-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260320195944
-- nome:   create_portal_pac_lookup

CREATE TABLE IF NOT EXISTS _tmp_portal_pac_lookup (
  sing_num TEXT NOT NULL,
  city_norm TEXT NOT NULL,
  num_pac TEXT NOT NULL,
  seq INT NOT NULL
);
