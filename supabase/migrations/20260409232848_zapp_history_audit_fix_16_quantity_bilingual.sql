-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409232848
-- nome:   zapp_history_audit_fix_16_quantity_bilingual

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
  v_text_clean := v_text_lower;

  -- Remove identificadores
  v_text_clean := regexp_replace(v_text_clean, '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, '\d{3}\.?\d{3}\.?\d{3}-?\d{2}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, '\d{5}-?\d{3}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, '\(?\d{2}\)?\s?9?\d{4}-?\d{4}', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, 'r\$\s*\d[\d\.,]*', '', 'g');
  v_text_clean := regexp_replace(v_text_clean, '\$\s*\d[\d\.,]*', '', 'g');

  -- Padrão 1: número + produto (PT + EN)
  v_match := (regexp_match(v_text_clean, '(\d{1,3}(?:\.\d{3})+|\d{2,6})\s*(unidades?|peças?|peca?s?|pcs?|pç?s?|un|und|itens?|canecas?|canetas?|squeezes?|mochilas?|camisetas?|copos?|brindes?|kits?|garrafas?|chaveiros?|ecobags?|power\s*banks?|cadernos?|capas?|toalhas?|bolsas?|bones?|bon[ée]s?|mugs?|pens?|bottles?|backpacks?|t-?shirts?|shirts?|caps?|hats?|notebooks?|umbrellas?|gifts?|bags?|tote\s*bags?)'))[1];
  IF v_match IS NOT NULL THEN
    v_qty := replace(v_match, '.', '');
    RETURN v_qty::INTEGER;
  END IF;

  -- Padrão 2: verbos de pedido (PT + EN) + número
  v_match := (regexp_match(v_text_clean, '(?:quero|preciso|cota[cç][aã]o|comprar|encomendar|fa[cç]o|i\s+need|i\s+want|need|want|order|looking\s+for)[^0-9]{0,30}(\d{1,3}(?:\.\d{3})+|\d{2,6})'))[1];
  IF v_match IS NOT NULL THEN
    v_qty := replace(v_match, '.', '');
    RETURN v_qty::INTEGER;
  END IF;

  -- Padrão 3: palavras escritas
  IF v_text_clean ~ '\m(mil|um mil|1 mil|one thousand)\M' THEN RETURN 1000; END IF;
  IF v_text_clean ~ '\m(cem|one hundred)\M' THEN RETURN 100; END IF;
  IF v_text_clean ~ '\m(duzent[oa]s|two hundred)\M' THEN RETURN 200; END IF;
  IF v_text_clean ~ '\m(quinhent[oa]s|five hundred)\M' THEN RETURN 500; END IF;

  -- Padrão 4: número + unidade genérica
  v_match := (regexp_match(v_text_clean, '(\d{2,6})\s*(?:unidades?|peças?|pcs?|pç?s?|un|und|units?|pieces?)'))[1];
  IF v_match IS NOT NULL THEN
    RETURN v_match::INTEGER;
  END IF;

  RETURN NULL;
END;
$fn$;

-- Re-extrai Aud05
UPDATE zapp_history.messages m
SET nlp_structured_order = COALESCE(m.nlp_structured_order, '{}'::jsonb)
    || jsonb_build_object('quantity', zapp_history.extract_quantity_from_text(m.content))
FROM public.contacts ct
WHERE ct.id = m.contact_id
  AND ct.first_name = 'Aud05 Ingles'
  AND zapp_history.extract_quantity_from_text(m.content) IS NOT NULL;

-- Re-run lead_score trigger manualmente (simula reset + re-trigger)
UPDATE zapp_history.messages m
SET lead_score = CASE
  WHEN m.primary_intent IN ('reclamar','cancelar') OR m.quarantined THEN 0
  ELSE LEAST(100, GREATEST(0,
    (CASE WHEN m.nlp_structured_order ? 'product' THEN 25 ELSE 0 END) +
    (CASE WHEN m.nlp_structured_order ? 'quantity' THEN 15 ELSE 0 END) +
    (CASE WHEN m.nlp_structured_order ? 'cnpj' THEN 20 ELSE 0 END) +
    (CASE WHEN m.budget_detected IS NOT NULL THEN 15 ELSE 0 END) +
    (CASE WHEN m.nlp_sentiment = 'urgent' THEN 15 ELSE 0 END) +
    (CASE WHEN m.funnel_stage IN ('fechamento','proposta','negociacao') THEN 10 ELSE 0 END) +
    (CASE WHEN m.referral_source->>'source' = 'indicacao_pessoa' THEN 20 ELSE 0 END) +
    (CASE WHEN m.referral_source->>'source' = 'cliente_recorrente' THEN 15 ELSE 0 END) +
    (CASE WHEN m.relationship_status->>'status' IN ('recorrente','recorrente_alto','recorrente_autoindicado') THEN 15 ELSE 0 END) -
    (CASE WHEN m.hesitation->>'level' = 'alta' THEN 10 ELSE 0 END) -
    (CASE WHEN m.credibility->>'level' IN ('baixa','critica_spam') THEN 15 ELSE 0 END)
  ))
END
FROM public.contacts ct
WHERE ct.id = m.contact_id AND ct.first_name LIKE 'Aud%';

-- Recalcula BANT
UPDATE zapp_history.messages m
SET bant_score = zapp_history.calculate_bant_score(m.id)
FROM public.contacts ct
WHERE ct.id = m.contact_id AND ct.first_name LIKE 'Aud%';
