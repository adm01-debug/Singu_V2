CREATE OR REPLACE FUNCTION public.schedule_company_visit(p_company_id uuid, p_visit_date timestamp with time zone, p_visit_type text DEFAULT 'commercial'::text, p_duration_minutes integer DEFAULT 60, p_notes text DEFAULT NULL::text, p_address_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_visit_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO scheduled_visits (company_id, user_id, visit_date, visit_type, duration_minutes, notes, address_id, status)
  VALUES (p_company_id, p_user_id, p_visit_date, p_visit_type, p_duration_minutes, p_notes, p_address_id, 'scheduled')
  RETURNING id INTO v_visit_id;
  
  RETURN v_visit_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS scheduled_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES companies(id),
    user_id uuid REFERENCES profiles(id),
    visit_date timestamptz NOT NULL,
    visit_type text DEFAULT 'commercial',
    duration_minutes int DEFAULT 60,
    notes text,
    address_id uuid,
    status text DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'
    completed_at timestamptz,
    completion_notes text,
    created_at timestamptz DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_visits_user_date ON scheduled_visits(user_id, visit_date);
  
  INSERT INTO scheduled_visits (company_id, user_id, visit_date, visit_type, duration_minutes, notes, address_id, status)
  VALUES (p_company_id, p_user_id, p_visit_date, p_visit_type, p_duration_minutes, p_notes, p_address_id, 'scheduled')
  RETURNING id INTO v_visit_id;
  
  RETURN v_visit_id;
END;
$function$
