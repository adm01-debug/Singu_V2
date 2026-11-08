DROP POLICY IF EXISTS "Permitir upload de logos"  ON storage.objects;
DROP POLICY IF EXISTS "Permitir update de logos"  ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'logos_authenticated_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY logos_authenticated_insert ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'logos' AND (SELECT auth.uid()) IS NOT NULL)
    $p$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'logos_authenticated_update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY logos_authenticated_update ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'logos' AND (SELECT auth.uid()) IS NOT NULL)
        WITH CHECK (bucket_id = 'logos' AND (SELECT auth.uid()) IS NOT NULL)
    $p$;
  END IF;
END $$;

UPDATE storage.buckets
SET
  file_size_limit    = 2097152,
  allowed_mime_types = ARRAY[
    'image/jpeg','image/png','image/gif',
    'image/webp','image/svg+xml','image/x-icon'
  ]
WHERE id = 'logos';
