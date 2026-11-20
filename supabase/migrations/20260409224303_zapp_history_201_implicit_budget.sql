-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409224303
-- nome:   zapp_history_201_implicit_budget

CREATE OR REPLACE FUNCTION zapp_history.detect_budget_sensitivity(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_level TEXT;
  v_signals TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('sensitivity','indefinido'); END IF;
  v_text_lower := lower(p_text);

  -- Alta sensibilidade (foco em preço)
  IF v_text_lower ~ '(mais barato|menor pre[çc]o|desconto|promo[çc][ãa]o|apertad[oa] de dinheiro|n[ãa]o posso gastar muito)' THEN
    v_signals := array_append(v_signals,'foco_desconto');
  END IF;
  IF v_text_lower ~ '(or[çc]amento limitado|verba curta|or[çc]amento apertado|t[ôo] sem grana)' THEN
    v_signals := array_append(v_signals,'verba_limitada');
  END IF;

  -- Baixa sensibilidade (foco em valor/qualidade)
  IF v_text_lower ~ '(melhor qualidade|premium|top de linha|n[ãa]o me importo com o pre[çc]o|sem restri[çc][ãa]o de or[çc]amento|verba aprovada)' THEN
    v_signals := array_append(v_signals,'foco_premium');
  END IF;

  v_level := CASE
    WHEN 'foco_desconto' = ANY(v_signals) OR 'verba_limitada' = ANY(v_signals) THEN 'alta'
    WHEN 'foco_premium' = ANY(v_signals) THEN 'baixa'
    ELSE 'media'
  END;

  RETURN jsonb_build_object('sensitivity', v_level, 'signals', to_jsonb(v_signals));
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS budget_sensitivity JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_budget_sens ON zapp_history.messages((budget_sensitivity->>'sensitivity')) WHERE budget_sensitivity IS NOT NULL;
GRANT EXECUTE ON FUNCTION zapp_history.detect_budget_sensitivity(TEXT) TO authenticated, service_role;
