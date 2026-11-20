DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.error_logs;  -- [singu-idem]
CREATE POLICY "Authenticated users can insert error logs"
  ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);