-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329190557
-- nome:   fix_alerts_add_supplier_types_and_fix_functions

-- FIX G3: Adicionar tipos supplier_* ao CHECK constraint de alerts.type
ALTER TABLE alerts DROP CONSTRAINT alerts_type_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_type_check CHECK (type = ANY (ARRAY[
  'relationship_risk','follow_up_due','birthday_reminder','inactivity_warning',
  'sentiment_drop','opportunity','disc_insight','life_event','engagement_spike',
  'churn_risk','upsell_opportunity','referral_opportunity','system','custom',
  'supplier_score_baixo','supplier_destaque',
  'supplier_homologacao_vencendo','supplier_homologacao_vencida',
  'supplier_nao_homologado'
]));

-- FIX G1+G2: Recriar fn_check_supplier_homologation_expiry com valores corretos
CREATE OR REPLACE FUNCTION fn_check_supplier_homologation_expiry()
RETURNS JSON AS $$
DECLARE
  v_vencidas INTEGER := 0;
  v_vencendo INTEGER := 0;
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT sh.id AS hom_id, sh.supplier_id, s.company_id, co.nome_crm
    FROM supplier_homologations sh
    JOIN suppliers s ON s.id = sh.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE sh.status = 'homologado' AND sh.validade < CURRENT_DATE
  LOOP
    UPDATE supplier_homologations SET status = 'vencido' WHERE id = v_rec.hom_id;
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
      'supplier_homologacao_vencida', 'critical',
      'Homologação Vencida: ' || v_rec.nome_crm,
      'A homologação do fornecedor ' || v_rec.nome_crm || ' venceu. Necessário reavaliar antes de novos pedidos.',
      'pending',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'homologation_id', v_rec.hom_id),
      NOW(), NOW());
    v_vencidas := v_vencidas + 1;
  END LOOP;

  FOR v_rec IN
    SELECT sh.id AS hom_id, sh.supplier_id, sh.validade, s.company_id, co.nome_crm
    FROM supplier_homologations sh
    JOIN suppliers s ON s.id = sh.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE sh.status = 'homologado'
      AND sh.validade BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
      AND NOT EXISTS (
        SELECT 1 FROM alerts a WHERE a.company_id = s.company_id 
        AND a.type = 'supplier_homologacao_vencendo' AND a.created_at >= NOW() - INTERVAL '7 days')
  LOOP
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
      'supplier_homologacao_vencendo', 'high',
      'Homologação Vencendo: ' || v_rec.nome_crm,
      'A homologação do fornecedor ' || v_rec.nome_crm || ' vence em ' || (v_rec.validade - CURRENT_DATE) || ' dias.',
      'pending',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'homologation_id', v_rec.hom_id, 'dias_restantes', v_rec.validade - CURRENT_DATE),
      NOW(), NOW());
    v_vencendo := v_vencendo + 1;
  END LOOP;

  RETURN json_build_object('vencidas_processadas', v_vencidas, 'alertas_vencendo', v_vencendo);
END;
$$ LANGUAGE plpgsql;

-- FIX G1+G2: Recriar fn_check_supplier_score_alerts com valores corretos
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
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
      'supplier_score_baixo', 'high',
      'Score Baixo: ' || v_rec.nome_crm,
      'Fornecedor ' || v_rec.nome_crm || ' com score ' || v_rec.score_geral || ' (' || v_rec.classificacao || '). Tendência: ' || COALESCE(v_rec.trend, 'N/A'),
      'pending',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'score', v_rec.score_geral, 'classificacao', v_rec.classificacao, 'trend', v_rec.trend),
      NOW(), NOW());
    v_alertas_neg := v_alertas_neg + 1;
  END LOOP;

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
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
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
$$ LANGUAGE plpgsql;
