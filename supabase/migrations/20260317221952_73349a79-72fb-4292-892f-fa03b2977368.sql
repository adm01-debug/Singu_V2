CREATE POLICY "Users can only update own automation logs"
ON public.automation_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);