-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330181409
-- nome:   improve_fn_check_carrier_score_alerts_coalesce

CREATE OR REPLACE FUNCTION fn_check_carrier_score_alerts()
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_threshold_baixo NUMERIC;
  v_threshold_destaque NUMERIC;
  v_alertas_neg INTEGER := 0;
  v_alertas_pos INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- FIX O1: COALESCE protege contra config deletada (fallback valores padrão)
  SELECT COALESCE(valor::numeric, 40) INTO v_threshold_baixo FROM config_regras_negocio WHERE chave = 'CARRIER_SCORE_ALERTA_BAIXO';
  IF v_threshold_baixo IS NULL THEN v_threshold_baixo := 40; END IF;
  
  SELECT COALESCE(valor::numeric, 85) INTO v_threshold_destaque FROM config_regras_negocio WHERE chave = 'CARRIER_SCORE_DESTAQUE';
  IF v_threshold_destaque IS NULL THEN v_threshold_destaque := 85; END IF;

  FOR v_rec IN
    SELECT cs.carrier_id, cs.score_geral, cs.classificacao, cs.trend, c.company_id, co.nome_crm
    FROM carrier_scores cs
    JOIN carriers c ON c.id = cs.carrier_id
    JOIN companies co ON co.id = c.company_id
    WHERE cs.score_geral < v_threshold_baixo
      AND NOT EXISTS (
        SELECT 1 FROM alerts a WHERE a.company_id = c.company_id 
        AND a.type = 'carrier_score_baixo' AND a.created_at >= NOW() - INTERVAL '7 days')
  LOOP
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
      'carrier_score_baixo', 'high',
      'Score Baixo: ' || v_rec.nome_crm,
      'Transportadora ' || v_rec.nome_crm || ' com score ' || v_rec.score_geral || ' (' || v_rec.classificacao || '). Tendência: ' || COALESCE(v_rec.trend, 'N/A'),
      'pending',
      jsonb_build_object('carrier_id', v_rec.carrier_id, 'score', v_rec.score_geral, 'classificacao', v_rec.classificacao, 'trend', v_rec.trend),
      NOW(), NOW());
    v_alertas_neg := v_alertas_neg + 1;
  END LOOP;

  FOR v_rec IN
    SELECT cs.carrier_id, cs.score_geral, cs.classificacao, cs.trend, c.company_id, co.nome_crm
    FROM carrier_scores cs
    JOIN carriers c ON c.id = cs.carrier_id
    JOIN companies co ON co.id = c.company_id
    WHERE cs.score_geral >= v_threshold_destaque
      AND NOT EXISTS (
        SELECT 1 FROM alerts a WHERE a.company_id = c.company_id 
        AND a.type = 'carrier_destaque' AND a.created_at >= NOW() - INTERVAL '30 days')
  LOOP
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
      'carrier_destaque', 'low',
      'Transportadora Destaque: ' || v_rec.nome_crm,
      'Transportadora ' || v_rec.nome_crm || ' com score ' || v_rec.score_geral || ' (' || v_rec.classificacao || '). Excelente performance!',
      'pending',
      jsonb_build_object('carrier_id', v_rec.carrier_id, 'score', v_rec.score_geral, 'classificacao', v_rec.classificacao),
      NOW(), NOW());
    v_alertas_pos := v_alertas_pos + 1;
  END LOOP;

  RETURN json_build_object('alertas_negativos', v_alertas_neg, 'alertas_positivos', v_alertas_pos);
END;
$function$;

COMMENT ON FUNCTION fn_check_carrier_score_alerts() IS 'Detecta scores baixos/destaque para transportadoras. FIX: COALESCE protege contra config deletada (fallback 40/85).';
