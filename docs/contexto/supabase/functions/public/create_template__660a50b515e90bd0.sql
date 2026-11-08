CREATE OR REPLACE FUNCTION public.create_template(p_name text, p_channel text, p_body text, p_category text DEFAULT NULL::text, p_subject text DEFAULT NULL::text, p_variables text[] DEFAULT '{}'::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO message_templates (name, channel, body, category, subject, variables, created_by)
  VALUES (p_name, p_channel, p_body, p_category, p_subject, p_variables, auth.uid())
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'template_id', v_id);
END;
$function$
