-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409165654
-- nome:   zapp_history_97_fix_extractor_collisions

-- Quantity: ignora se o número faz parte de CNPJ/CPF/CEP/telefone
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

  -- Remove CNPJs, CPFs, CEPs, telefones, R$ valores antes de buscar quantidade
  v_text_clean := v_text_lower;
  v_text_clean := regexp_replace(v_text_clean, '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', '', 'g'); -- CNPJ
  v_text_clean := regexp_replace(v_text_clean, '\d{3}\.?\d{3}\.?\d{3}-?\d{2}', '', 'g');       -- CPF
  v_text_clean := regexp_replace(v_text_clean, '\d{5}-?\d{3}', '', 'g');                        -- CEP
  v_text_clean := regexp_replace(v_text_clean, '\(?\d{2}\)?\s?9?\d{4}-?\d{4}', '', 'g');        -- Tel
  v_text_clean := regexp_replace(v_text_clean, 'r\$\s*\d[\d\.,]*', '', 'g');                    -- R$ valores
  v_text_clean := regexp_replace(v_text_clean, '\d+(?:[.,]\d+)?\s*mil(?:\s*reais?)?', '', 'g'); -- "X mil"
  v_text_clean := regexp_replace(v_text_clean, '(?:or[cç]amento|verba|investimento|valor|gasto|budget)[^0-9]{0,30}\d[\d\.,]*', '', 'g');

  -- Padrão 1: número direto + palavra de produto/unidade
  v_match := (regexp_match(v_text_clean, '(\d{1,3}(?:\.\d{3})+|\d{2,6})\s*(unidades?|peças?|peca?s?|pcs?|pç?s?|un|und|itens?|canecas?|canetas?|squeezes?|mochilas?|camisetas?|copos?|brindes?|kits?|garrafas?|chaveiros?|ecobags?|power\s*banks?|cadernos?|capas?)'))[1];
  IF v_match IS NOT NULL THEN
    v_qty := replace(v_match, '.', '');
    RETURN v_qty::INTEGER;
  END IF;

  -- Padrão 2: número grande próximo de palavras de pedido
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

  -- Padrão 4: número solto (último recurso) — só pega se for múltiplo provável
  v_match := (regexp_match(v_text_clean, '\m(\d{2,6})\M'))[1];
  IF v_match IS NOT NULL THEN
    -- Só retorna se for número "redondo" típico de pedido (>= 50)
    IF v_match::INTEGER >= 50 THEN
      RETURN v_match::INTEGER;
    END IF;
  END IF;

  RETURN NULL;
END;
$fn$;

-- Budget: similar — ignora números que claramente são quantidade ("orçamento para 500 squeezes" não é R$500)
CREATE OR REPLACE FUNCTION zapp_history.extract_budget_from_text(p_text TEXT)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_match TEXT;
  v_clean TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- "X mil reais" / "verba de X mil"
  v_match := (regexp_match(v_text_lower, '(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*mil(?:\s*reais?)?'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(v_match, ',', '.');
    RETURN (v_clean::NUMERIC) * 1000;
  END IF;

  -- R$ X.XXX,XX
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  -- R$ XXXXX (sem separador, valor inteiro grande, mínimo 4 dígitos)
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d{4,8})'))[1];
  IF v_match IS NOT NULL THEN
    RETURN v_match::NUMERIC;
  END IF;

  -- "orçamento de R$ X" / "verba aprovada de R$ X" — REQUER R$ ou "reais"
  v_match := (regexp_match(v_text_lower, '(?:or[cç]amento|verba|investimento|budget)[^0-9]{0,30}(?:r\$|de\s*r\$)\s*(\d{1,3}(?:[\.,]\d{3})+(?:,\d{2})?|\d{3,8})'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  RETURN NULL;
END;
$fn$;

-- Funnel stage: dúvida sobre pagamento/entrega = interesse, não descoberta
CREATE OR REPLACE FUNCTION zapp_history.detect_funnel_stage(p_text TEXT, p_has_product BOOLEAN, p_has_quantity BOOLEAN, p_has_budget BOOLEAN, p_has_cnpj BOOLEAN)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN 'descoberta'; END IF;
  v_text_lower := lower(p_text);

  -- FECHAMENTO
  IF v_text_lower ~ '(fech(ar|ado|amos)|aprovado|pode mandar|pode produzir|confirmado|vou pagar|pix de|envia o boleto|conta pra dep[óo]sito|manda o boleto)' THEN
    RETURN 'fechamento';
  END IF;

  -- NEGOCIACAO
  IF v_text_lower ~ '(desconto|abate|melhor pre[çc]o|condi[çc][ãa]o|negocia|consigo pagar|que tal|fa[çc]o por|aceita|achei (caro|car[íi]ssimo)|t[áa] caro)' THEN
    RETURN 'negociacao';
  END IF;

  -- PROPOSTA: tem produto + quantidade + (budget OU cnpj OU prazo explícito)
  IF p_has_product AND p_has_quantity AND (p_has_budget OR p_has_cnpj) THEN
    RETURN 'proposta';
  END IF;

  -- COTACAO: tem produto + quantidade
  IF p_has_product AND p_has_quantity THEN
    RETURN 'cotacao';
  END IF;

  -- INTERESSE: pediu informação OU pergunta sobre pagamento/entrega/garantia (já está engajado)
  IF p_has_product
     OR v_text_lower ~ '(quero saber|gostaria de cotar|gostaria de saber|preciso de or[çc]amento|trabalham com|fazem|voc[êe]s\s+(parcelam|aceitam|entregam|fazem)|forma de pagamento|prazo de entrega)' THEN
    RETURN 'interesse';
  END IF;

  RETURN 'descoberta';
END;
$fn$;

-- Backfill: re-extrai tudo das mensagens do teste 96
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

    -- Re-extrai quantidade limpa
    v_qty := zapp_history.extract_quantity_from_text(r.content);
    IF v_qty IS NOT NULL THEN
      v_struct := v_struct || jsonb_build_object('quantity', v_qty);
    ELSE
      v_struct := v_struct - 'quantity';
    END IF;

    -- Re-extrai budget limpo
    v_budget := zapp_history.extract_budget_from_text(r.content);
    IF v_budget IS NOT NULL THEN
      v_struct := v_struct || jsonb_build_object('budget', v_budget);
    ELSE
      v_struct := v_struct - 'budget';
    END IF;

    v_stage := zapp_history.detect_funnel_stage(
      r.content,
      v_struct ? 'product',
      v_struct ? 'quantity',
      v_budget IS NOT NULL,
      v_struct ? 'cnpj'
    );

    UPDATE zapp_history.messages
    SET nlp_structured_order = v_struct,
        budget_detected = v_budget,
        funnel_stage = v_stage
    WHERE id = r.id;

    PERFORM zapp_history.calculate_lead_score(r.id);
  END LOOP;
END $$;
