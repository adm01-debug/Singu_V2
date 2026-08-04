-- 1. Coluna para schema descoberto em conexões Supabase externas
ALTER TABLE public.connection_configs
  ADD COLUMN IF NOT EXISTS discovered_schema jsonb,
  ADD COLUMN IF NOT EXISTS discovered_at timestamptz;

-- 2. Tabela de log de chamadas MCP
CREATE TABLE IF NOT EXISTS public.mcp_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES public.connection_configs(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  arguments_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('success','error','denied')),
  error_message text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_connection ON public.mcp_tool_calls(connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_tool ON public.mcp_tool_calls(tool_name, created_at DESC);

ALTER TABLE public.mcp_tool_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read mcp_tool_calls"
  ON public.mcp_tool_calls FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role insert mcp_tool_calls"
  ON public.mcp_tool_calls FOR INSERT
  TO authenticated
  WITH CHECK (false);
