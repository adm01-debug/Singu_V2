CREATE OR REPLACE FUNCTION public.cron_rodizio_closer_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_ativo boolean;
BEGIN
  SELECT COALESCE(valor,'false')='true' INTO v_ativo
    FROM public.config_regras_negocio WHERE chave='RODIZIO_CLOSER_ATIVO';
  IF v_ativo THEN
    PERFORM public.rodizio_closer_executar('REAL', 250);
  END IF;
END;
$function$
