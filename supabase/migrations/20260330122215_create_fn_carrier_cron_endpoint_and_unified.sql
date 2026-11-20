-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330122215
-- nome:   create_fn_carrier_cron_endpoint_and_unified

-- Passo 23: fn_carrier_cron_endpoint
CREATE OR REPLACE FUNCTION fn_carrier_cron_endpoint()
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_daily_check JSON;
  v_dashboard JSON;
  v_queue_count INTEGER;
  v_data_quality JSON;
BEGIN
  SELECT fn_carrier_daily_check() INTO v_daily_check;
  SELECT row_to_json(d) INTO v_dashboard FROM vw_carrier_qualification_dashboard d;
  SELECT COUNT(*) INTO v_queue_count FROM vw_carrier_homologation_queue;
  SELECT row_to_json(q) INTO v_data_quality FROM vw_carrier_data_quality q;

  RETURN json_build_object(
    'executed_at', NOW(),
    'daily_check', v_daily_check,
    'dashboard', v_dashboard,
    'homologation_queue_size', v_queue_count,
    'data_quality', v_data_quality
  );
END;
$function$;

-- Passo 39: Cron unificado que chama ambos (suppliers + carriers)
CREATE OR REPLACE FUNCTION fn_cron_daily_endpoint()
RETURNS json
LANGUAGE plpgsql
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
$function$;

COMMENT ON FUNCTION fn_carrier_cron_endpoint() IS 'Endpoint cron para transportadoras: daily_check + dashboard + fila + data_quality';
COMMENT ON FUNCTION fn_cron_daily_endpoint() IS 'Endpoint unificado para n8n: executa cron de suppliers E carriers em uma única chamada';
