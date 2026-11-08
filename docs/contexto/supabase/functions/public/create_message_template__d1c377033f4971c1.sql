CREATE OR REPLACE FUNCTION public.create_message_template(p_name text, p_content text, p_type text DEFAULT 'email'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO interaction_templates (name, content, type, is_public) VALUES (p_name, p_content, p_type, true) RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
