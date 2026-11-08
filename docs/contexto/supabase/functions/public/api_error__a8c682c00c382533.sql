CREATE OR REPLACE FUNCTION public.api_error(p_message text, p_code text DEFAULT 'ERROR'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'success', false,
    'error', jsonb_build_object(
      'code', p_code,
      'message', p_message
    ),
    'timestamp', now()
  );
END;
$function$
