CREATE OR REPLACE FUNCTION public.fn_supplier_cron_endpoint()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_daily_check JSON;
  v_dashboard JSON;
  v_queue_count INTEGER;
  v_data_quality JSON;
BEGIN
  -- Executar verificações diárias
  SELECT fn_supplier_daily_check() INTO v_daily_check;

  -- Dashboard resumido
  SELECT row_to_json(d) INTO v_dashboard FROM vw_supplier_qualification_dashboard d;

  -- Fila de homologação
  SELECT COUNT(*) INTO v_queue_count FROM vw_supplier_homologation_queue;

  -- Qualidade de dados resumida
  SELECT row_to_json(q) INTO v_data_quality FROM vw_supplier_data_quality q;

  RETURN json_build_object(
    'executed_at', NOW(),
    'daily_check', v_daily_check,
    'dashboard', v_dashboard,
    'homologation_queue_size', v_queue_count,
    'data_quality', v_data_quality
  );
END;
$function$
