CREATE OR REPLACE FUNCTION public.create_meeting(p_company_id uuid, p_title text, p_scheduled_at timestamp with time zone, p_meeting_type text DEFAULT 'call'::text, p_duration_minutes integer DEFAULT 30, p_contact_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO meetings (company_id, contact_id, deal_id, user_id, title, description, meeting_type, scheduled_at, duration_minutes)
  VALUES (p_company_id, p_contact_id, p_deal_id, p_user_id, p_title, p_description, p_meeting_type, p_scheduled_at, p_duration_minutes)
  RETURNING id INTO v_id;
  
  -- Criar lembrete automático
  INSERT INTO reminders (company_id, user_id, title, reminder_date, reminder_type, notes)
  VALUES (p_company_id, p_user_id, 'Reunião: ' || p_title, p_scheduled_at - INTERVAL '15 minutes', 'meeting', 'Lembrete de reunião');
  
  RETURN v_id;
END;
$function$
