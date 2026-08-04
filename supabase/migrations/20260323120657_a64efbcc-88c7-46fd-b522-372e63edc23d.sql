
CREATE TABLE public.query_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  table_name text,
  rpc_name text,
  duration_ms integer NOT NULL DEFAULT 0,
  record_count integer,
  query_limit integer,
  query_offset integer,
  count_mode text,
  severity text NOT NULL DEFAULT 'normal',
  error_message text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.query_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telemetry" ON public.query_telemetry FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own telemetry" ON public.query_telemetry FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own telemetry" ON public.query_telemetry FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_query_telemetry_created_at ON public.query_telemetry (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_severity ON public.query_telemetry (severity);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_user_id ON public.query_telemetry (user_id);
