-- Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_start SMALLINT NOT NULL DEFAULT 22 CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end SMALLINT NOT NULL DEFAULT 8 CHECK (quiet_hours_end BETWEEN 0 AND 23),
  weekend_silence BOOLEAN NOT NULL DEFAULT false,
  enabled_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  min_urgency_email TEXT NOT NULL DEFAULT 'high',
  min_urgency_push TEXT NOT NULL DEFAULT 'critical',
  digest_mode TEXT NOT NULL DEFAULT 'immediate' CHECK (digest_mode IN ('immediate','hourly','daily')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self read prefs" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "self upsert prefs" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "self update prefs" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Notifications queue
CREATE TABLE IF NOT EXISTS public.smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('critical','high','normal','low')),
  decided_channel TEXT NOT NULL DEFAULT 'in_app' CHECK (decided_channel IN ('in_app','email','push','whatsapp','suppressed')),
  decision_reason TEXT,
  bundle_key TEXT,
  bundle_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','dismissed','clicked','suppressed','snoozed')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_notif_user_status ON public.smart_notifications (user_id, status, scheduled_for DESC);
CREATE INDEX IF NOT EXISTS idx_smart_notif_bundle ON public.smart_notifications (user_id, bundle_key, created_at DESC) WHERE bundle_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_smart_notif_urgency ON public.smart_notifications (user_id, urgency, status);

ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self read notif" ON public.smart_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "self insert notif" ON public.smart_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "self update notif" ON public.smart_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "self delete notif" ON public.smart_notifications FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_notifications;

-- RPC manual enqueue with bundle dedup (6h window)
CREATE OR REPLACE FUNCTION public.enqueue_smart_notification(
  _event_type TEXT,
  _title TEXT,
  _body TEXT DEFAULT NULL,
  _entity_type TEXT DEFAULT NULL,
  _entity_id TEXT DEFAULT NULL,
  _urgency TEXT DEFAULT 'normal',
  _bundle_key TEXT DEFAULT NULL,
  _action_url TEXT DEFAULT NULL,
  _payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _existing UUID;
  _new_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF _bundle_key IS NOT NULL THEN
    SELECT id INTO _existing
    FROM public.smart_notifications
    WHERE user_id = auth.uid()
      AND bundle_key = _bundle_key
      AND status IN ('pending','delivered','snoozed')
      AND created_at > now() - INTERVAL '6 hours'
    ORDER BY created_at DESC LIMIT 1;

    IF _existing IS NOT NULL THEN
      UPDATE public.smart_notifications
      SET bundle_count = bundle_count + 1,
          payload = payload || jsonb_build_object('last_bundle_at', now()),
          urgency = CASE
            WHEN _urgency = 'critical' THEN 'critical'
            WHEN urgency = 'critical' THEN 'critical'
            WHEN _urgency = 'high' OR urgency = 'high' THEN 'high'
            ELSE urgency
          END
      WHERE id = _existing;
      RETURN _existing;
    END IF;
  END IF;

  INSERT INTO public.smart_notifications (
    user_id, event_type, entity_type, entity_id, title, body,
    payload, urgency, bundle_key, action_url, decided_channel, decision_reason
  ) VALUES (
    auth.uid(), _event_type, _entity_type, _entity_id, _title, _body,
    COALESCE(_payload, '{}'::jsonb), _urgency, _bundle_key, _action_url,
    'in_app', 'manual_enqueue'
  ) RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

-- Auto trigger from contact_next_actions when urgency=critical
CREATE OR REPLACE FUNCTION public.notify_critical_next_action()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _contact_name TEXT;
BEGIN
  IF NEW.urgency <> 'critical' THEN RETURN NEW; END IF;

  SELECT (first_name || ' ' || last_name) INTO _contact_name
  FROM public.contacts WHERE id = NEW.contact_id;

  INSERT INTO public.smart_notifications (
    user_id, event_type, entity_type, entity_id, title, body,
    urgency, bundle_key, decided_channel, decision_reason, action_url, payload
  ) VALUES (
    NEW.user_id,
    'next_action_critical',
    'contact',
    NEW.contact_id::text,
    'Ação urgente: ' || COALESCE(_contact_name, 'contato'),
    NEW.action,
    'critical',
    'next_action:' || NEW.contact_id::text,
    'in_app',
    'auto_trigger_critical_action',
    '/contatos/' || NEW.contact_id::text,
    jsonb_build_object('reason', NEW.reason, 'channel_suggested', NEW.channel)
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_critical_next_action ON public.contact_next_actions;
CREATE TRIGGER trg_notify_critical_next_action
AFTER INSERT OR UPDATE OF urgency ON public.contact_next_actions
FOR EACH ROW EXECUTE FUNCTION public.notify_critical_next_action();

-- Trigger updated_at on prefs
CREATE TRIGGER trg_notif_prefs_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();