-- Migration: fix_logos_bucket_listing (Wave 137)
-- Addresses public_bucket_allows_listing advisor warning.
--
-- The "Permitir leitura pública de logos" SELECT policy with roles={public}
-- allows any unauthenticated caller to list all files in the logos bucket
-- via the Storage REST API (/storage/v1/object/list/logos).
--
-- Logos are public ASSETS (served via public CDN URLs) but the FILE LIST
-- itself is not public information — exposing bucket contents reveals
-- internal structure and file names.
--
-- Fix: drop the broad public SELECT policy, add an authenticated-only SELECT.
-- Public URL access (https://<project>.supabase.co/storage/v1/object/public/logos/...)
-- continues to work because the bucket has public=true at the storage layer;
-- that does NOT require a SELECT policy on storage.objects.

DROP POLICY IF EXISTS "Permitir leitura pública de logos" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'logos_authenticated_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY logos_authenticated_select ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'logos')
    $p$;
  END IF;
END $$;
