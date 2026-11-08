CREATE OR REPLACE FUNCTION public.update_whatsapp_status(p_whatsapp_id text, p_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE whatsapp_messages SET 
    status = p_status,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
    read_at = CASE WHEN p_status = 'read' THEN NOW() ELSE read_at END
  WHERE whatsapp_id = p_whatsapp_id;
  RETURN FOUND;
END;
$function$
