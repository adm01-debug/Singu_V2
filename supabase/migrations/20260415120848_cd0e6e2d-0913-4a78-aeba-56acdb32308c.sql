-- Drop overly permissive INSERT policy and replace with scoped one
DROP POLICY IF EXISTS "System can insert schema drift alerts" ON public.schema_drift_alerts;

CREATE POLICY "Users can insert their own schema drift alerts"
ON public.schema_drift_alerts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);