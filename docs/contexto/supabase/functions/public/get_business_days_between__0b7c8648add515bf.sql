CREATE OR REPLACE FUNCTION public.get_business_days_between(p_start_date date, p_end_date date)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int := 0;
  v_current date := p_start_date;
BEGIN
  WHILE v_current <= p_end_date LOOP
    IF EXTRACT(ISODOW FROM v_current) < 6 THEN
      v_count := v_count + 1;
    END IF;
    v_current := v_current + 1;
  END LOOP;
  RETURN v_count;
END;
$function$
