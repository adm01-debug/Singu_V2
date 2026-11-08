CREATE OR REPLACE FUNCTION zapp_history.detect_funnel_stage(p_text text, p_has_product boolean, p_has_quantity boolean, p_has_budget boolean, p_has_cnpj boolean)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
