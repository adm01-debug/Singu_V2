CREATE OR REPLACE FUNCTION public.create_calendar_event(p_title text, p_start_time timestamp with time zone, p_user_id uuid, p_company_id uuid DEFAULT NULL::uuid, p_contact_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid, p_event_type text DEFAULT 'meeting'::text, p_end_time timestamp with time zone DEFAULT NULL::timestamp with time zone, p_description text DEFAULT NULL::text, p_location text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO calendar_events (title, start_time, end_time, user_id, company_id, contact_id, deal_id, event_type, description, location)
  VALUES (p_title, p_start_time, COALESCE(p_end_time, p_start_time + INTERVAL '1 hour'), p_user_id, p_company_id, p_contact_id, p_deal_id, p_event_type, p_description, p_location)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'event_id', v_id);
END;
$function$
