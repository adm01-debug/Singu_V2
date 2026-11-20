-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321140230
-- nome:   block_non_social_platforms

-- Bloqueia cadastro de website, whatsapp e google_business em company_social_media.
-- Cada dado deve ficar no lugar canônico:
--   website     → companies.website
--   whatsapp    → company_phones (is_whatsapp = true)
--   google_business → company_addresses (google_place_id / google_maps_url)
ALTER TABLE company_social_media
ADD CONSTRAINT chk_social_media_platforms_only
CHECK (plataforma NOT IN ('website', 'whatsapp', 'google_business'));
