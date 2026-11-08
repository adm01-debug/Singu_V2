CREATE OR REPLACE FUNCTION public.create_alert(p_user_id uuid, p_type text, p_title text, p_message text, p_priority text DEFAULT 'medium'::text, p_contact_id uuid DEFAULT NULL::uuid, p_company_id uuid DEFAULT NULL::uuid, p_action_type text DEFAULT NULL::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO alerts (user_id, type, title, message, priority, contact_id, company_id, action_type, expires_at)
    VALUES (p_user_id, p_type, p_title, p_message, p_priority, p_contact_id, p_company_id, p_action_type, p_expires_at)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$function$
