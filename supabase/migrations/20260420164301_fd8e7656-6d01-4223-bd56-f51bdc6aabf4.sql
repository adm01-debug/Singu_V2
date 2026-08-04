-- Fechamento de gaps RLS (defense-in-depth) detectados na re-auditoria

-- 1) document_views: bloqueia INSERTs anônimos. Apenas service role (edge functions) pode inserir.
DROP POLICY IF EXISTS "service_role_inserts_document_views" ON public.document_views;
CREATE POLICY "service_role_inserts_document_views"
ON public.document_views
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 2) incoming_webhook_logs: bloqueia INSERTs de usuários comuns (apenas service role escreve).
DROP POLICY IF EXISTS "service_role_inserts_webhook_logs" ON public.incoming_webhook_logs;
CREATE POLICY "service_role_inserts_webhook_logs"
ON public.incoming_webhook_logs
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 3) access_blocked_log: idem.
DROP POLICY IF EXISTS "service_role_inserts_access_blocked_log" ON public.access_blocked_log;
CREATE POLICY "service_role_inserts_access_blocked_log"
ON public.access_blocked_log
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 4) connection_quotas: permite SELECT de quotas próprias por non-admin (read-only) para enforcement client-side.
DROP POLICY IF EXISTS "users_read_own_connection_quotas" ON public.connection_quotas;
CREATE POLICY "users_read_own_connection_quotas"
ON public.connection_quotas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.incoming_webhooks w
    WHERE w.id = connection_quotas.webhook_id
      AND w.created_by = auth.uid()
  )
);