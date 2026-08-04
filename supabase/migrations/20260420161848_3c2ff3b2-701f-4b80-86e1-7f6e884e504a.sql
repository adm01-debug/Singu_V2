-- Ação 1: Corrige logging quebrado em mcp_tool_calls (WITH CHECK false bloqueava todos os inserts)
DROP POLICY IF EXISTS "Service role insert mcp_tool_calls" ON public.mcp_tool_calls;

CREATE POLICY "Service role insert mcp_tool_calls"
ON public.mcp_tool_calls
FOR INSERT
TO service_role
WITH CHECK (true);

-- Ação 2: Restringe INSERT em login_attempts apenas ao service_role (evita poluição do audit trail)
CREATE POLICY "Service role insert login_attempts"
ON public.login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);