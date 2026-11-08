CREATE OR REPLACE FUNCTION public.api_success(p_data jsonb, p_message text DEFAULT 'Operação realizada com sucesso'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'message', p_message,
    'data', p_data,
    'timestamp', now()
  );
END;
$function$
