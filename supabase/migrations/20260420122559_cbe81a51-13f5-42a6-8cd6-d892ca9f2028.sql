
-- 1) Campos HMAC nos webhooks
ALTER TABLE public.incoming_webhooks
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS require_signature boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replay_window_seconds integer NOT NULL DEFAULT 300;

-- 2) Tabela de quotas mensais
CREATE TABLE IF NOT EXISTS public.connection_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.incoming_webhooks(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  calls_limit integer NOT NULL DEFAULT 10000,
  calls_used integer NOT NULL DEFAULT 0,
  overage_blocked boolean NOT NULL DEFAULT true,
  alert_sent_80 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (webhook_id, period_start)
);

ALTER TABLE public.connection_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage connection quotas"
  ON public.connection_quotas
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_connection_quotas_webhook_period
  ON public.connection_quotas(webhook_id, period_start DESC);

-- 3) Trigger de auditoria com mascaramento de segredos
CREATE OR REPLACE FUNCTION public.audit_connection_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_user uuid;
BEGIN
  v_user := COALESCE(auth.uid(), NEW.created_by, OLD.created_by);

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  END IF;

  -- Mascarar campos sensíveis
  IF v_old IS NOT NULL THEN
    IF v_old ? 'config' THEN v_old := jsonb_set(v_old, '{config}', '"***masked***"'::jsonb); END IF;
    IF v_old ? 'encrypted_config' THEN v_old := v_old - 'encrypted_config'; END IF;
    IF v_old ? 'webhook_secret' AND v_old->>'webhook_secret' IS NOT NULL THEN
      v_old := jsonb_set(v_old, '{webhook_secret}', '"***masked***"'::jsonb);
    END IF;
    IF v_old ? 'token' THEN v_old := jsonb_set(v_old, '{token}', '"***masked***"'::jsonb); END IF;
  END IF;
  IF v_new IS NOT NULL THEN
    IF v_new ? 'config' THEN v_new := jsonb_set(v_new, '{config}', '"***masked***"'::jsonb); END IF;
    IF v_new ? 'encrypted_config' THEN v_new := v_new - 'encrypted_config'; END IF;
    IF v_new ? 'webhook_secret' AND v_new->>'webhook_secret' IS NOT NULL THEN
      v_new := jsonb_set(v_new, '{webhook_secret}', '"***masked***"'::jsonb);
    END IF;
    IF v_new ? 'token' THEN v_new := jsonb_set(v_new, '{token}', '"***masked***"'::jsonb); END IF;
  END IF;

  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    v_user,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old,
    v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_connection_configs ON public.connection_configs;
CREATE TRIGGER trg_audit_connection_configs
  AFTER INSERT OR UPDATE OR DELETE ON public.connection_configs
  FOR EACH ROW EXECUTE FUNCTION public.audit_connection_changes();

DROP TRIGGER IF EXISTS trg_audit_incoming_webhooks ON public.incoming_webhooks;
CREATE TRIGGER trg_audit_incoming_webhooks
  AFTER INSERT OR UPDATE OR DELETE ON public.incoming_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.audit_connection_changes();

-- 4) RPC: incrementar quota e checar bloqueio (chamada pelo edge function)
CREATE OR REPLACE FUNCTION public.increment_webhook_quota(_webhook_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period date := date_trunc('month', now())::date;
  v_quota public.connection_quotas%ROWTYPE;
BEGIN
  INSERT INTO public.connection_quotas (webhook_id, period_start)
  VALUES (_webhook_id, v_period)
  ON CONFLICT (webhook_id, period_start) DO NOTHING;

  UPDATE public.connection_quotas
  SET calls_used = calls_used + 1,
      updated_at = now()
  WHERE webhook_id = _webhook_id AND period_start = v_period
  RETURNING * INTO v_quota;

  RETURN jsonb_build_object(
    'calls_used', v_quota.calls_used,
    'calls_limit', v_quota.calls_limit,
    'overage_blocked', v_quota.overage_blocked,
    'exceeded', v_quota.calls_used > v_quota.calls_limit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_webhook_quota(uuid) TO service_role;
