-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321181136
-- nome:   fix_numero_normalizado_not_null

-- ============================================================
-- FALHA #1: Fechar furo na UNIQUE — NOT NULL em numero_normalizado
-- ============================================================
ALTER TABLE public.company_phones
  ALTER COLUMN numero_normalizado SET NOT NULL;

ALTER TABLE public.contact_phones
  ALTER COLUMN numero_normalizado SET NOT NULL;
