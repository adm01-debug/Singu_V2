CREATE OR REPLACE FUNCTION zapp_history.extract_quantity_from_text(p_text text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
