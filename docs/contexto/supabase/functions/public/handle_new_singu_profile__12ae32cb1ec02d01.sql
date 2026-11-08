CREATE OR REPLACE FUNCTION public.handle_new_singu_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
BEGIN
  -- Auto-criar compatibility_settings
  INSERT INTO public.compatibility_settings (user_id, alert_threshold, alert_only_important, important_min_relationship_score, email_notifications)
  VALUES (NEW.id, 50, true, 70, false)
  ON CONFLICT DO NOTHING;
  
  -- Auto-criar health_alert_settings
  INSERT INTO public.health_alert_settings (user_id, warning_threshold, critical_threshold, check_frequency_hours, notify_on_warning, notify_on_critical, email_notifications, push_notifications)
  VALUES (NEW.id, 50, 30, 24, false, true, true, true)
  ON CONFLICT DO NOTHING;
  
  -- Auto-criar automation_rules padrão
  INSERT INTO public.automation_rules (user_id, name, description, trigger_type, trigger_config, conditions, actions, is_active)
  VALUES 
    (NEW.id, 'Alerta sentimento negativo', 'Criar alerta quando sentimento é negativo', 'interaction_sentiment', '{"sentiment":"negativo"}', '[]', '[{"type":"create_alert","priority":"high"}]', true),
    (NEW.id, 'Lembrete cadência vencida', 'Notificar cadência expirada', 'cadence_overdue', '{"days_overdue":3}', '[]', '[{"type":"create_alert","priority":"medium"}]', true),
    (NEW.id, 'Alerta saúde crítica', 'Score saúde abaixo de 30', 'health_score_drop', '{"threshold":30}', '[]', '[{"type":"create_alert","priority":"critical"}]', true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$function$
