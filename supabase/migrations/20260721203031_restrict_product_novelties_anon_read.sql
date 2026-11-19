-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721203031
-- nome:   restrict_product_novelties_anon_read

DROP POLICY IF EXISTS anon_read_novelties ON public.product_novelties;

DROP POLICY IF EXISTS authenticated_read_novelties ON public.product_novelties;
CREATE POLICY authenticated_read_novelties
  ON public.product_novelties
  FOR SELECT
  TO authenticated
  USING (true);
