
CREATE OR REPLACE FUNCTION public.notify_admins_on_critical_behavioral_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  notif_title text;
BEGIN
  IF NEW.severity <> 'critical' THEN
    RETURN NEW;
  END IF;

  IF NEW.alert_type NOT IN ('behavioral_regen_error_rate', 'behavioral_regen_cron_stale') THEN
    RETURN NEW;
  END IF;

  notif_title := CASE
    WHEN NEW.alert_type = 'behavioral_regen_cron_stale'
      THEN '🚨 Cron de reanálise comportamental travado'
    ELSE '🚨 Taxa de erro crítica na reanálise comportamental'
  END;

  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.smart_notifications (
      user_id, event_type, entity_type, entity_id,
      title, body, payload, urgency, decided_channel,
      decision_reason, status, scheduled_for, action_url
    ) VALUES (
      admin_id,
      'system_alert_critical',
      'system_alert',
      NEW.id::text,
      notif_title,
      NEW.message,
      jsonb_build_object(
        'alert_id', NEW.id,
        'alert_type', NEW.alert_type,
        'severity', NEW.severity,
        'metadata', NEW.metadata
      ),
      'high',
      'in_app',
      'Alerta crítico de infraestrutura',
      'pending',
      now(),
      '/admin/behavioral-regen-audit'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_critical_behavioral ON public.system_alerts;

CREATE TRIGGER trg_notify_admins_critical_behavioral
AFTER INSERT ON public.system_alerts
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_critical_behavioral_alert();
