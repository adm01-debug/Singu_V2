CREATE OR REPLACE FUNCTION public.drop_old_ai_gateway_metrics_partitions(retention_days integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cutoff   date := (now() - make_interval(days => retention_days))::date;
  rec      record;
  dropped  integer := 0;
  part_end date;
BEGIN
  FOR rec IN
    SELECT c.relname
      FROM pg_inherits i
      JOIN pg_class c ON c.oid = i.inhrelid
     WHERE i.inhparent = 'public.ai_gateway_metrics'::regclass
  LOOP
    BEGIN
      part_end := (to_date(substring(rec.relname from 'ai_gateway_metrics_(\d{4}_\d{2})'), 'YYYY_MM')
                   + interval '1 month')::date;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    IF part_end < cutoff THEN
      EXECUTE format('DROP TABLE IF EXISTS public.%I', rec.relname);
      dropped := dropped + 1;
    END IF;
  END LOOP;

  RETURN dropped;
END;
$function$
