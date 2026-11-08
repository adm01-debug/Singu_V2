CREATE OR REPLACE FUNCTION public.complete_reminder(p_reminder_id uuid, p_create_interaction boolean DEFAULT false, p_interaction_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reminder record;
  v_channel text;
BEGIN
  PERFORM public.assert_reminder_access(p_reminder_id);
  SELECT * INTO v_reminder FROM reminders WHERE id = p_reminder_id;
  
  IF v_reminder IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE reminders 
  SET is_completed = true, completed_at = NOW()
  WHERE id = p_reminder_id;
  
  IF p_create_interaction THEN
    -- Mapear tipo de lembrete para channel
    v_channel := CASE v_reminder.reminder_type
      WHEN 'call' THEN 'telefone'
      WHEN 'email' THEN 'email'
      WHEN 'visit' THEN 'presencial'
      WHEN 'whatsapp' THEN 'whatsapp'
      ELSE 'outro'
    END;
    
    INSERT INTO interactions (company_id, type, channel, direction, resumo, content, user_id, data_interacao)
    VALUES (
      v_reminder.company_id, 
      v_reminder.reminder_type,
      v_channel,
      'outbound',
      COALESCE(p_interaction_notes, 'Lembrete completado: ' || v_reminder.title),
      COALESCE(p_interaction_notes, 'Lembrete completado: ' || v_reminder.title),
      v_reminder.user_id,
      NOW()
    );
  END IF;
  
  RETURN true;
END;
$function$
