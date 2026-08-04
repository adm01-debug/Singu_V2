-- ============================================================
-- Rodada K — Observabilidade & Resiliência de Integrações
-- ============================================================

-- 1) DLQ para incoming-webhook
CREATE TABLE IF NOT EXISTS public.incoming_webhook_dlq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.incoming_webhooks(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_ip TEXT,
  user_agent TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','succeeded','failed','abandoned')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dlq_status_retry ON public.incoming_webhook_dlq(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_dlq_webhook_id ON public.incoming_webhook_dlq(webhook_id);

ALTER TABLE public.incoming_webhook_dlq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage DLQ"
ON public.incoming_webhook_dlq FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_dlq_updated_at
BEFORE UPDATE ON public.incoming_webhook_dlq
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) RPC: métricas P50/P95/P99 por conexão (últimos 7d)
CREATE OR REPLACE FUNCTION public.get_connection_metrics(_connection_id UUID)
RETURNS TABLE(
  p50 NUMERIC,
  p95 NUMERIC,
  p99 NUMERIC,
  success_rate NUMERIC,
  total_calls BIGINT,
  failures BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p50,
    COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p95,
    COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p99,
    CASE WHEN COUNT(*) = 0 THEN 100::NUMERIC
         ELSE ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC * 100) / COUNT(*), 2)
    END AS success_rate,
    COUNT(*)::BIGINT AS total_calls,
    COUNT(*) FILTER (WHERE status = 'error')::BIGINT AS failures
  FROM public.connection_test_logs
  WHERE connection_id = _connection_id
    AND created_at >= now() - interval '7 days';
END;
$$;

REVOKE ALL ON FUNCTION public.get_connection_metrics(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_connection_metrics(UUID) TO authenticated;

-- 3) Trigger: alerta após 5 falhas consecutivas em uma conexão
CREATE OR REPLACE FUNCTION public.notify_connection_failures()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures INT;
  conn_name TEXT;
  owner_id UUID;
BEGIN
  IF NEW.status <> 'error' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO recent_failures
  FROM (
    SELECT status FROM public.connection_test_logs
    WHERE connection_id = NEW.connection_id
    ORDER BY created_at DESC
    LIMIT 5
  ) recent
  WHERE status = 'error';

  IF recent_failures >= 5 THEN
    SELECT name, created_by INTO conn_name, owner_id
    FROM public.connection_configs WHERE id = NEW.connection_id;

    INSERT INTO public.smart_notifications (
      user_id, event_type, title, body, urgency,
      entity_type, entity_id, decided_channel, payload
    ) VALUES (
      owner_id, 'connection_alert',
      'Conexão "' || COALESCE(conn_name, 'desconhecida') || '" com falhas consecutivas',
      '5 ou mais testes falharam recentemente. Verifique credenciais e endpoint.',
      'high', 'connection', NEW.connection_id, 'in_app',
      jsonb_build_object('reason', 'consecutive_failures', 'count', recent_failures)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_connection_failures ON public.connection_test_logs;
CREATE TRIGGER trg_notify_connection_failures
AFTER INSERT ON public.connection_test_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_failures();

-- 4) Trigger: webhook com 10+ erros em 1h
CREATE OR REPLACE FUNCTION public.notify_webhook_errors()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hourly_errors INT;
  wh_name TEXT;
  owner_id UUID;
BEGIN
  IF NEW.status <> 'error' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO hourly_errors
  FROM public.incoming_webhook_logs
  WHERE webhook_id = NEW.webhook_id
    AND status = 'error'
    AND created_at >= now() - interval '1 hour';

  IF hourly_errors = 10 THEN
    SELECT name, created_by INTO wh_name, owner_id
    FROM public.incoming_webhooks WHERE id = NEW.webhook_id;

    INSERT INTO public.smart_notifications (
      user_id, event_type, title, body, urgency,
      entity_type, entity_id, decided_channel, payload
    ) VALUES (
      owner_id, 'connection_alert',
      'Webhook "' || COALESCE(wh_name, 'desconhecido') || '" com alta taxa de erro',
      '10+ falhas registradas na última hora.',
      'high', 'webhook', NEW.webhook_id, 'in_app',
      jsonb_build_object('reason', 'webhook_error_burst', 'count_1h', hourly_errors)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_webhook_errors ON public.incoming_webhook_logs;
CREATE TRIGGER trg_notify_webhook_errors
AFTER INSERT ON public.incoming_webhook_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_webhook_errors();