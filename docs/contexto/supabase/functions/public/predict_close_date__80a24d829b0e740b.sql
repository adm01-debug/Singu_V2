CREATE OR REPLACE FUNCTION public.predict_close_date(p_deal_id uuid)
 RETURNS date
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_stage text; v_avg_days int; v_created_at timestamptz;
BEGIN
  SELECT pipeline_stage, created_at INTO v_stage, v_created_at FROM deals WHERE id = p_deal_id;
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 30)::int INTO v_avg_days 
  FROM deals WHERE status = 'ganho' AND pipeline_stage = v_stage;
  RETURN (v_created_at + (v_avg_days || ' days')::interval)::date;
END;
$function$
