CREATE OR REPLACE FUNCTION public.fn_supplier_daily_check()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result_homologacao JSON;
  v_result_scores JSON;
BEGIN
  -- 1. Verificar homologações vencidas e vencendo
  SELECT fn_check_supplier_homologation_expiry() INTO v_result_homologacao;

  -- 2. Verificar scores e gerar alertas
  SELECT fn_check_supplier_score_alerts() INTO v_result_scores;

  RETURN json_build_object(
    'executed_at', NOW(),
    'homologacao', v_result_homologacao,
    'scores', v_result_scores
  );
END;
$function$
