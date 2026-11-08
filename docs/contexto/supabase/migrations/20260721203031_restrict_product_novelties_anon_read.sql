DROP POLICY IF EXISTS anon_read_novelties ON public.product_novelties;

CREATE POLICY authenticated_read_novelties
  ON public.product_novelties
  FOR SELECT
  TO authenticated
  USING (true);
