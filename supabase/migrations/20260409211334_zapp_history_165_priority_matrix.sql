-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409211334
-- nome:   zapp_history_165_priority_matrix

-- Matriz Eisenhower adaptada: urgência × importância (lead_score) → quadrante
CREATE OR REPLACE FUNCTION zapp_history.calculate_priority_quadrant(p_lead_score INT, p_sentiment TEXT, p_churn_risk TEXT, p_funnel_stage TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_urgent BOOLEAN;
  v_important BOOLEAN;
  v_quadrant TEXT;
  v_action TEXT;
BEGIN
  v_urgent := (p_sentiment = 'urgent') OR (p_churn_risk IN ('alto','critico')) OR (p_funnel_stage IN ('negociacao','fechamento'));
  v_important := COALESCE(p_lead_score, 0) >= 60;

  IF v_urgent AND v_important THEN
    v_quadrant := 'Q1_FAZER_AGORA';
    v_action := '🔥 Atender imediatamente. Lead alto valor + urgente.';
  ELSIF NOT v_urgent AND v_important THEN
    v_quadrant := 'Q2_AGENDAR';
    v_action := '📅 Lead importante mas não urgente. Agendar follow-up estratégico.';
  ELSIF v_urgent AND NOT v_important THEN
    v_quadrant := 'Q3_DELEGAR';
    v_action := '⚡ Urgente mas baixo valor. Delegar para SDR ou bot.';
  ELSE
    v_quadrant := 'Q4_AUTOMACAO';
    v_action := '🤖 Baixo valor + sem urgência. Resposta automática ou catálogo.';
  END IF;

  RETURN jsonb_build_object(
    'quadrant', v_quadrant,
    'urgent', v_urgent,
    'important', v_important,
    'action', v_action
  );
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS priority_quadrant TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_priority_quad ON zapp_history.messages(priority_quadrant) WHERE priority_quadrant IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.calculate_priority_quadrant(INT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Trigger que calcula o quadrante automaticamente
CREATE OR REPLACE FUNCTION zapp_history.trg_set_priority_quadrant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;
  NEW.priority_quadrant := (zapp_history.calculate_priority_quadrant(
    NEW.lead_score,
    NEW.nlp_sentiment,
    NEW.churn_risk->>'risk',
    NEW.funnel_stage
  ))->>'quadrant';
  UPDATE zapp_history.messages SET priority_quadrant = NEW.priority_quadrant WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_priority_quadrant ON zapp_history.messages;
CREATE TRIGGER trg_priority_quadrant
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.trg_set_priority_quadrant();

-- View do quadrante
CREATE OR REPLACE VIEW zapp_history.v_priority_matrix AS
WITH quadrants AS (
  SELECT 'Q1_FAZER_AGORA' AS q, 1 AS ord, '🔥 Fazer agora' AS label UNION ALL
  SELECT 'Q2_AGENDAR', 2, '📅 Agendar' UNION ALL
  SELECT 'Q3_DELEGAR', 3, '⚡ Delegar' UNION ALL
  SELECT 'Q4_AUTOMACAO', 4, '🤖 Automatizar'
)
SELECT
  q.q AS quadrante,
  q.ord,
  q.label,
  COUNT(m.id) AS total,
  COUNT(DISTINCT m.contact_id) AS contatos,
  AVG(m.lead_score)::numeric(5,2) AS score_medio
FROM quadrants q
LEFT JOIN zapp_history.messages m ON m.priority_quadrant = q.q
GROUP BY q.q, q.ord, q.label
ORDER BY q.ord;

GRANT SELECT ON zapp_history.v_priority_matrix TO authenticated;
