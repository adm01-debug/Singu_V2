CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type character varying, p_title character varying, p_message text DEFAULT NULL::text, p_category character varying DEFAULT 'normal'::character varying, p_contact_id uuid DEFAULT NULL::uuid, p_action_url text DEFAULT NULL::text, p_action_label character varying DEFAULT NULL::character varying, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_notification_id UUID;
    v_priority        INTEGER;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  PERFORM public.assert_self_user_id(p_user_id);

  v_priority := CASE p_category
      WHEN 'urgent'    THEN 1
      WHEN 'important' THEN 3
      WHEN 'normal'    THEN 5
      ELSE 7
  END;

  INSERT INTO notifications (
      user_id, notification_type, category, priority,
      title, message, contact_id,
      action_url, action_label, metadata, icon
  ) VALUES (
      p_user_id, p_type, p_category, v_priority,
      p_title, p_message, p_contact_id,
      p_action_url, p_action_label, p_metadata,
      CASE p_type
          WHEN 'follow_up'            THEN '📞'
          WHEN 'meeting'              THEN '📅'
          WHEN 'alert'                THEN '⚠️'
          WHEN 'churn_risk'           THEN '🚨'
          WHEN 'closing_opportunity'  THEN '🎯'
          WHEN 'birthday'             THEN '🎂'
          WHEN 'task'                 THEN '✅'
          ELSE '📌'
      END
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$function$
