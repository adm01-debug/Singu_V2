-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260331103256
-- nome:   fix_fn_check_supplier_score_alerts_user_id

CREATE OR REPLACE FUNCTION fn_check_supplier_score_alerts()
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_threshold_baixo NUMERIC;
  v_threshold_destaque NUMERIC;
  v_alertas_neg INTEGER := 0;
  v_alertas_pos INTEGER := 0;
  v_rec RECORD;
  v_system_user_id UUID;
BEGIN
  -- COALESCE thresholds
  SELECT COALESCE(valor::numeric, 40) INTO v_threshold_baixo FROM config_regras_negocio WHERE chave = 'SUPPLIER_SCORE_ALERTA_BAIXO';
  IF v_threshold_baixo IS NULL THEN v_threshold_baixo := 40; END IF;
  SELECT COALESCE(valor::numeric, 85) INTO v_threshold_destaque FROM config_regras_negocio WHERE chave = 'SUPPLIER_SCORE_DESTAQUE';
  IF v_threshold_destaque IS NULL THEN v_threshold_destaque := 85; END IF;

  -- FIX B1: Buscar SYSTEM_ALERT_USER_ID com COALESCE duplo
  SELECT COALESCE(valor::uuid, '0b7c504d-b3d9-4144-b6b5-40a57b84feef'::uuid) INTO v_system_user_id
  FROM config_regras_negocio WHERE chave = 'SYSTEM_ALERT_USER_ID';
  IF v_system_user_id IS NULL THEN v_system_user_id := '0b7c504d-b3d9-4144-b6b5-40a57b84feef'::uuid; END IF;

  -- Scores baixos
  FOR v_rec IN
    SELECT ss.supplier_id, ss.score_geral, ss.classificacao, ss.trend, s.company_id, co.nome_crm
    FROM supplier_scores ss
    JOIN suppliers s ON s.id = ss.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE ss.score_geral < v_threshold_baixo
      AND NOT EXISTS (
        SELECT 1 FROM alerts a WHERE a.company_id = s.company_id 
        AND a.type = 'supplier_score_baixo' AND a.created_at >= NOW() - INTERVAL '7 days')
  LOOP
    INSERT INTO alerts (id, user_id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_system_user_id, v_rec.company_id,
      'supplier_score_baixo', 'high',
      'Score Baixo: ' || v_rec.nome_crm,
      'Fornecedor ' || v_rec.nome_crm || ' com score ' || v_rec.score_geral || ' (' || v_rec.classificacao || '). Tendência: ' || COALESCE(v_rec.trend, 'N/A'),
      'pending',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'score', v_rec.score_geral, 'classificacao', v_rec.classificacao, 'trend', v_rec.trend),
      NOW(), NOW());
    v_alertas_neg := v_alertas_neg + 1;
  END LOOP;

  -- Destaques
  FOR v_rec IN
    SELECT ss.supplier_id, ss.score_geral, ss.classificacao, ss.trend, s.company_id, co.nome_crm
    FROM supplier_scores ss
    JOIN suppliers s ON s.id = ss.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE ss.score_geral >= v_threshold_destaque
      AND NOT EXISTS (
        SELECT 1 FROM alerts a WHERE a.company_id = s.company_id 
        AND a.type = 'supplier_destaque' AND a.created_at >= NOW() - INTERVAL '30 days')
  LOOP
    INSERT INTO alerts (id, user_id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_system_user_id, v_rec.company_id,
      'supplier_destaque', 'low',
      'Fornecedor Destaque: ' || v_rec.nome_crm,
      'Fornecedor ' || v_rec.nome_crm || ' com score ' || v_rec.score_geral || ' (' || v_rec.classificacao || '). Excelente performance!',
      'pending',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'score', v_rec.score_geral, 'classificacao', v_rec.classificacao),
      NOW(), NOW());
    v_alertas_pos := v_alertas_pos + 1;
  END LOOP;

  RETURN json_build_object('alertas_negativos', v_alertas_neg, 'alertas_positivos', v_alertas_pos);
END;
$function$;

COMMENT ON FUNCTION fn_check_supplier_score_alerts() IS 'Detecta scores baixos/destaque para fornecedores. FIX B1: user_id incluído. COALESCE em thresholds e user_id.';
