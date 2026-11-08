CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(p_start_time timestamp with time zone, p_sla_hours integer, p_business_hours_only boolean DEFAULT true)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deadline timestamptz;
  v_remaining_hours int := p_sla_hours;
  v_current timestamptz := p_start_time;
  v_hour int;
BEGIN
  IF NOT p_business_hours_only THEN
    RETURN p_start_time + (p_sla_hours || ' hours')::interval;
  END IF;
  
  -- Horário comercial: 9h às 18h, seg-sex
  WHILE v_remaining_hours > 0 LOOP
    v_hour := EXTRACT(HOUR FROM v_current);
    
    IF EXTRACT(ISODOW FROM v_current) < 6 AND v_hour >= 9 AND v_hour < 18 THEN
      v_remaining_hours := v_remaining_hours - 1;
    END IF;
    
    v_current := v_current + INTERVAL '1 hour';
  END LOOP;
  
  RETURN v_current;
END;
$function$
