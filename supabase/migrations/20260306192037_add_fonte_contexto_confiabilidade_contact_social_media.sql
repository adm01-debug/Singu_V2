-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260306192037
-- nome:   add_fonte_contexto_confiabilidade_contact_social_media

ALTER TABLE public.contact_social_media
  ADD COLUMN IF NOT EXISTS fonte          TEXT,
  ADD COLUMN IF NOT EXISTS contexto       TEXT,
  ADD COLUMN IF NOT EXISTS confiabilidade SMALLINT DEFAULT 0;

UPDATE public.contact_social_media
SET fonte = origem
WHERE origem IS NOT NULL
  AND fonte IS NULL;
