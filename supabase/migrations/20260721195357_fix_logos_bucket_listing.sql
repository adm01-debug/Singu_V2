-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721195357
-- nome:   fix_logos_bucket_listing

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
