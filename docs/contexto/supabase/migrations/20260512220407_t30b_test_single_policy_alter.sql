ALTER POLICY "Users can view their own automation logs" ON _dormant.automation_logs
  USING (((SELECT auth.uid()) = user_id));
