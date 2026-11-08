CREATE OR REPLACE FUNCTION public.cron_rodizio_sdr_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_ativo boolean;
BEGIN
  SELECT COALESCE(valor,'false')='true' INTO v_ativo
    FROM public.config_regras_negocio WHERE chave='RODIZIO_SDR_ATIVO';
  IF v_ativo THEN
    PERFORM public.rodizio_sdr_executar('REAL', 250);
  END IF;
END;
$function$
