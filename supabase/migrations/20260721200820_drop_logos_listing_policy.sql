-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721200820
-- nome:   drop_logos_listing_policy

-- Migration: drop_logos_listing_policy (Wave 145)
-- Fixes advisor: public_bucket_allows_listing (logos bucket).
-- The logos bucket is public=true — CDN URLs work without a SELECT policy.
-- Dropping the SELECT policy prevents listing via /object/list/ API.

DROP POLICY IF EXISTS logos_authenticated_select ON storage.objects;
