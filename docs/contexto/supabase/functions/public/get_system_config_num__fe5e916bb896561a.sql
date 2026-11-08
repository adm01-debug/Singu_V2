CREATE OR REPLACE FUNCTION public.get_system_config_num(_key text, _default numeric)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT value FROM public.system_config WHERE key = _key), _default);
$function$
