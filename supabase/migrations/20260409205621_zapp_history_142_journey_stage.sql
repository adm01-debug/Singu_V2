-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205621
-- nome:   zapp_history_142_journey_stage

CREATE OR REPLACE FUNCTION zapp_history.detect_journey_stage(p_text TEXT, p_funnel_stage TEXT, p_lead_score INT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- BOFU (Bottom of Funnel) - pronto pra comprar
  IF p_funnel_stage IN ('proposta','negociacao','fechamento') THEN RETURN 'BOFU'; END IF;
  IF v_text_lower ~ '(quero comprar|fechar pedido|fechar com voc[êe]s|fa[cz]er o pedido|enviar boleto|forma de pagamento|prazo de entrega final)' THEN RETURN 'BOFU'; END IF;
  IF p_lead_score >= 70 THEN RETURN 'BOFU'; END IF;

  -- MOFU (Middle of Funnel) - comparando, considerando
  IF p_funnel_stage IN ('cotacao','interesse') THEN RETURN 'MOFU'; END IF;
  IF v_text_lower ~ '(comparativo|diferen[cç]a entre|qual melhor|por que escolher|estou pesquisando|vendo op[cç][õo]es)' THEN RETURN 'MOFU'; END IF;

  -- TOFU (Top of Funnel) - descobrindo, primeira interação
  RETURN 'TOFU';
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS journey_stage TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_journey ON zapp_history.messages(journey_stage) WHERE journey_stage IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_journey_stage(TEXT, TEXT, INT) TO authenticated, service_role;
