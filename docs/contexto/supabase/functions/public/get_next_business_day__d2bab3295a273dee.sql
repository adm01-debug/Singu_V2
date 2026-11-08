CREATE OR REPLACE FUNCTION public.get_next_business_day(p_date date DEFAULT CURRENT_DATE)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date date := p_date + 1;
BEGIN
  WHILE EXTRACT(ISODOW FROM v_date) >= 6 LOOP
    v_date := v_date + 1;
  END LOOP;
  RETURN v_date;
END;
$function$
