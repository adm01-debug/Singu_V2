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
