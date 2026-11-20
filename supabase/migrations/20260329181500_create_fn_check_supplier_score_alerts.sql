-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181500
-- nome:   create_fn_check_supplier_score_alerts

CREATE OR REPLACE FUNCTION fn_check_supplier_score_alerts()
RETURNS JSON AS $$
DECLARE
  v_threshold_baixo NUMERIC;
  v_threshold_destaque NUMERIC;
  v_alertas_neg INTEGER := 0;
  v_alertas_pos INTEGER := 0;
  v_rec RECORD;
BEGIN
  SELECT valor::numeric INTO v_threshold_baixo FROM config_regras_negocio WHERE chave = 'SUPPLIER_SCORE_ALERTA_BAIXO';
  SELECT valor::numeric INTO v_threshold_destaque FROM config_regras_negocio WHERE chave = 'SUPPLIER_SCORE_DESTAQUE';

  -- Alertas NEGATIVOS: score abaixo do limiar
  FOR v_rec IN
    SELECT ss.supplier_id, ss.score_geral, ss.classificacao, ss.trend, s.company_id, co.nome_crm
    FROM supplier_scores ss
    JOIN suppliers s ON s.id = ss.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE ss.score_geral < v_threshold_baixo
      AND NOT EXISTS (
        SELECT 1 FROM alerts a 
        WHERE a.company_id = s.company_id 
          AND a.type = 'supplier_score_baixo'
          AND a.created_at >= NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_rec.company_id,
      'supplier_score_baixo', 'high',
      'Score Baixo: ' || v_rec.nome_crm,
      'O fornecedor ' || v_rec.nome_crm || ' está com score ' || v_rec.score_geral || ' (' || v_rec.classificacao || '). Tendência: ' || COALESCE(v_rec.trend, 'N/A') || '.',
      'active',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'score', v_rec.score_geral, 'classificacao', v_rec.classificacao, 'trend', v_rec.trend),
      NOW(), NOW()
    );
    v_alertas_neg := v_alertas_neg + 1;
  END LOOP;

  -- Alertas POSITIVOS: score acima do destaque
  FOR v_rec IN
    SELECT ss.supplier_id, ss.score_geral, ss.classificacao, ss.trend, s.company_id, co.nome_crm
    FROM supplier_scores ss
    JOIN suppliers s ON s.id = ss.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE ss.score_geral >= v_threshold_destaque
      AND NOT EXISTS (
        SELECT 1 FROM alerts a 
        WHERE a.company_id = s.company_id 
          AND a.type = 'supplier_destaque'
          AND a.created_at >= NOW() - INTERVAL '30 days'
      )
  LOOP
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_rec.company_id,
      'supplier_destaque', 'normal',
      'Fornecedor Destaque: ' || v_rec.nome_crm,
      'O fornecedor ' || v_rec.nome_crm || ' atingiu score ' || v_rec.score_geral || ' (' || v_rec.classificacao || '). Excelente performance!',
      'active',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'score', v_rec.score_geral, 'classificacao', v_rec.classificacao),
      NOW(), NOW()
    );
    v_alertas_pos := v_alertas_pos + 1;
  END LOOP;

  RETURN json_build_object('alertas_negativos', v_alertas_neg, 'alertas_positivos', v_alertas_pos);
END;
$$ LANGUAGE plpgsql;
