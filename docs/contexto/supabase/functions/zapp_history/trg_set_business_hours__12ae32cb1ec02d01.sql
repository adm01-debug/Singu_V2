CREATE OR REPLACE FUNCTION zapp_history.trg_set_business_hours()
 RETURNS trigger
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_local TIMESTAMPTZ;
  v_hour INT;
  v_dow INT;
BEGIN
  v_local := NEW.created_at AT TIME ZONE 'America/Sao_Paulo';
  v_hour := EXTRACT(HOUR FROM v_local);
  v_dow := EXTRACT(DOW FROM v_local); -- 0=domingo, 6=sábado

  -- Horário comercial: seg-sex 8h-18h
  NEW.in_business_hours := (v_dow BETWEEN 1 AND 5) AND (v_hour BETWEEN 8 AND 17);

  NEW.day_of_week := CASE v_dow
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
  END;

  RETURN NEW;
END;
$function$
