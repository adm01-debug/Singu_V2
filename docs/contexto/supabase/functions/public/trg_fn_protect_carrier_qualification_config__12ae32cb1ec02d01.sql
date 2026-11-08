CREATE OR REPLACE FUNCTION public.trg_fn_protect_carrier_qualification_config()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF EXISTS(SELECT 1 FROM carrier_scores WHERE segment_code = OLD.segment_code) THEN
    RAISE EXCEPTION 'Não é possível deletar segmento "%" pois existem transportadoras classificadas nele.', OLD.segment_code;
  END IF;
  RETURN OLD;
END;
$function$
