DROP POLICY IF EXISTS "Service role can insert anomalies" ON public.connection_anomalies;

DROP POLICY IF EXISTS "Only service role inserts anomalies" ON public.connection_anomalies;  -- [singu-idem]
CREATE POLICY "Only service role inserts anomalies"
  ON public.connection_anomalies FOR INSERT
  TO service_role
  WITH CHECK (true);