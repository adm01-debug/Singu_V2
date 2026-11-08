CREATE OR REPLACE FUNCTION public.fn_cron_daily_endpoint()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_supplier_result JSON;
  v_carrier_result JSON;
BEGIN
  SELECT fn_supplier_cron_endpoint() INTO v_supplier_result;
  SELECT fn_carrier_cron_endpoint() INTO v_carrier_result;

  RETURN json_build_object(
    'executed_at', NOW(),
    'supplier', v_supplier_result,
    'carrier', v_carrier_result
  );
END;
$function$
