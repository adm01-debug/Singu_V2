-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409165738
-- nome:   zapp_history_98_fix_qty_match_after_orcamento

CREATE OR REPLACE FUNCTION zapp_history.extract_quantity_from_text(p_text TEXT)
RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_match TEXT;
  v_qty TEXT;
  v_text_lower TEXT;
  v_text_clean TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Remove só identificadores (CNPJ/CPF/CEP/tel) e R$ valores explícitos
  v_text_clean := v_text_lower;
  v_text_clean := regexp_replace(v_text_clean, '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, '\d{3}\.?\d{3}\.?\d{3}-?\d{2}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, '\d{5}-?\d{3}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, '\(?\d{2}\)?\s?9?\d{4}-?\d{4}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, 'r\$\s*\d[\d\.,]*', '', 'g');

  -- NÃO remove "orçamento para X" porque pode ser quantidade ("orçamento para 500 squeezes")
  -- A regra é: número + palavra de produto/unidade SEMPRE conta como quantidade

  -- Padrão 1: número direto + palavra de produto/unidade (mais permissivo)
  v_match := (regexp_match(v_text_clean, '(\d{1,3}(?:\.\d{3})+|\d{2,6})\s*(unidades?|peças?|peca?s?|pcs?|pç?s?|un|und|itens?|canecas?|canetas?|squeezes?|mochilas?|camisetas?|copos?|brindes?|kits?|garrafas?|chaveiros?|ecobags?|power\s*banks?|cadernos?|capas?|toalhas?)'))[1];
  IF v_match IS NOT NULL THEN
    v_qty := replace(v_match, '.', '');
    RETURN v_qty::INTEGER;
  END IF;

  -- Padrão 2: número grande próximo de verbos de pedido
  v_match := (regexp_match(v_text_clean, '(?:quero|preciso|cota[cç][aã]o|comprar|encomendar|fa[cç]o)[^0-9]{0,30}(\d{1,3}(?:\.\d{3})+|\d{2,6})'))[1];
  IF v_match IS NOT NULL THEN
    v_qty := replace(v_match, '.', '');
    RETURN v_qty::INTEGER;
  END IF;

  -- Padrão 3: palavras
  IF v_text_clean ~ '\m(mil|um mil|1 mil)\M' THEN RETURN 1000; END IF;
  IF v_text_clean ~ '\mcem\M' THEN RETURN 100; END IF;
  IF v_text_clean ~ '\m(duzent[oa]s)\M' THEN RETURN 200; END IF;
  IF v_text_clean ~ '\m(quinhent[oa]s)\M' THEN RETURN 500; END IF;

  -- Padrão 4: "X unidades" / "X peças" sem produto explícito
  v_match := (regexp_match(v_text_clean, '(\d{2,6})\s*(?:unidades?|peças?|pcs?|pç?s?|un|und)'))[1];
  IF v_match IS NOT NULL THEN
    RETURN v_match::INTEGER;
  END IF;

  RETURN NULL;
END;
$fn$;

-- Re-run backfill no #003
DO $$
DECLARE
  r RECORD;
  v_struct JSONB;
  v_qty INT;
  v_budget NUMERIC;
  v_stage TEXT;
BEGIN
  FOR r IN SELECT id, content, nlp_structured_order FROM zapp_history.messages WHERE whatsapp_message_id LIKE '\_v96\_%' ESCAPE '\'
  LOOP
    v_struct := COALESCE(r.nlp_structured_order, '{}'::jsonb);
    v_qty := zapp_history.extract_quantity_from_text(r.content);
    IF v_qty IS NOT NULL THEN
      v_struct := v_struct || jsonb_build_object('quantity', v_qty);
    END IF;
    v_budget := zapp_history.extract_budget_from_text(r.content);
    IF v_budget IS NOT NULL THEN
      v_struct := v_struct || jsonb_build_object('budget', v_budget);
    END IF;
    v_stage := zapp_history.detect_funnel_stage(r.content, v_struct ? 'product', v_struct ? 'quantity', v_budget IS NOT NULL, v_struct ? 'cnpj');

    UPDATE zapp_history.messages
    SET nlp_structured_order = v_struct, budget_detected = v_budget, funnel_stage = v_stage
    WHERE id = r.id;

    PERFORM zapp_history.calculate_lead_score(r.id);
  END LOOP;
END $$;

SELECT
  whatsapp_message_id, funnel_stage, lead_score,
  nlp_structured_order->>'quantity' AS qtd,
  budget_detected AS budget
FROM zapp_history.messages
WHERE whatsapp_message_id LIKE '\_v96\_%' ESCAPE '\'
ORDER BY whatsapp_message_id;
