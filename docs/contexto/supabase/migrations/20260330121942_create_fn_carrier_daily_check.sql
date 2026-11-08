CREATE OR REPLACE FUNCTION fn_carrier_daily_check()
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_result_homologacao JSON;
  v_result_scores JSON;
BEGIN
  SELECT fn_check_carrier_homologation_expiry() INTO v_result_homologacao;
  SELECT fn_check_carrier_score_alerts() INTO v_result_scores;

  RETURN json_build_object(
    'executed_at', NOW(),
    'homologacao', v_result_homologacao,
    'scores', v_result_scores
  );
END;
$function$;

COMMENT ON FUNCTION fn_carrier_daily_check() IS 'Orquestrador diário: verifica homologações vencidas/vencendo + scores baixos/destaque para transportadoras.';
