-- Drop the generic ALL policy (security risk)
DROP POLICY IF EXISTS "Users can manage their own DISC conversion metrics" ON public.disc_conversion_metrics;

-- Drop the duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view their own DISC conversion metrics" ON public.disc_conversion_metrics;

-- Create granular policies
CREATE POLICY "Users can view their own DISC conversion metrics"
ON public.disc_conversion_metrics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DISC conversion metrics"
ON public.disc_conversion_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DISC conversion metrics"
ON public.disc_conversion_metrics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DISC conversion metrics"
ON public.disc_conversion_metrics
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);