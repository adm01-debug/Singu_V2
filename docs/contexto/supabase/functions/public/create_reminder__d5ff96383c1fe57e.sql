CREATE OR REPLACE FUNCTION public.create_reminder(p_company_id uuid, p_title text, p_reminder_date timestamp with time zone, p_reminder_type text DEFAULT 'general'::text, p_notes text DEFAULT NULL::text, p_priority text DEFAULT 'medium'::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reminder_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO reminders (company_id, user_id, title, reminder_date, reminder_type, notes, priority)
  VALUES (p_company_id, p_user_id, p_title, p_reminder_date, p_reminder_type, p_notes, p_priority)
  RETURNING id INTO v_reminder_id;
  
  RETURN v_reminder_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES companies(id),
    user_id uuid REFERENCES profiles(id),
    title text NOT NULL,
    reminder_date timestamptz NOT NULL,
    reminder_type text DEFAULT 'general',
    notes text,
    priority text DEFAULT 'medium',
    is_completed boolean DEFAULT false,
    completed_at timestamptz,
    snoozed_until timestamptz,
    created_at timestamptz DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date);
  CREATE INDEX IF NOT EXISTS idx_reminders_company ON reminders(company_id);
  
  INSERT INTO reminders (company_id, user_id, title, reminder_date, reminder_type, notes, priority)
  VALUES (p_company_id, p_user_id, p_title, p_reminder_date, p_reminder_type, p_notes, p_priority)
  RETURNING id INTO v_reminder_id;
  
  RETURN v_reminder_id;
END;
$function$
