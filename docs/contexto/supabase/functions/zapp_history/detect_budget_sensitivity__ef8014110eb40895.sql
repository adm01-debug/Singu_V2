CREATE OR REPLACE FUNCTION zapp_history.detect_budget_sensitivity(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
