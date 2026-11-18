-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409211447
-- nome:   zapp_history_167_fix_trigger_order

-- O problema: BEFORE/AFTER triggers do mesmo evento rodam em ordem alfabética por nome.
-- trg_lead_score_calc < trg_priority_quadrant alfabeticamente, mas precisamos garantir.
-- Solução: o quadrant trigger lê lead_score da tabela DEPOIS que o lead_score trigger gravou.
-- Mas o NEW.lead_score no AFTER UPDATE é o valor que veio na atualização original (sem o cálculo do outro trigger).
-- Fix: ler do banco, não do NEW.

CREATE OR REPLACE FUNCTION zapp_history.trg_set_priority_quadrant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  v_score INT;
  v_quadrant TEXT;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;

  -- Lê lead_score atualizado do banco (já gravado pelo trg_lead_score_calc)
  SELECT lead_score INTO v_score FROM zapp_history.messages WHERE id = NEW.id;

  v_quadrant := (zapp_history.calculate_priority_quadrant(
    v_score,
    NEW.nlp_sentiment,
    NEW.churn_risk->>'risk',
    NEW.funnel_stage
  ))->>'quadrant';

  UPDATE zapp_history.messages SET priority_quadrant = v_quadrant WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;

-- Renomear o trigger pra garantir que rode DEPOIS de trg_lead_score_calc (z > l)
DROP TRIGGER IF EXISTS trg_priority_quadrant ON zapp_history.messages;
CREATE TRIGGER zzz_trg_priority_quadrant
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.trg_set_priority_quadrant();

-- Backfill nas mensagens do teste 166
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, lead_score, nlp_sentiment, churn_risk, funnel_stage
           FROM zapp_history.messages WHERE whatsapp_message_id LIKE '\_v166\_%' ESCAPE '\'
  LOOP
    UPDATE zapp_history.messages
    SET priority_quadrant = (zapp_history.calculate_priority_quadrant(
      r.lead_score, r.nlp_sentiment, r.churn_risk->>'risk', r.funnel_stage
    ))->>'quadrant'
    WHERE id = r.id;
  END LOOP;
END $$;

SELECT
  whatsapp_message_id,
  speaker_role AS papel,
  lead_score,
  nlp_sentiment AS sentimento,
  funnel_stage AS etapa,
  priority_quadrant AS quadrante
FROM zapp_history.messages
WHERE whatsapp_message_id LIKE '\_v166\_%' ESCAPE '\'
ORDER BY whatsapp_message_id;
