-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409143052
-- nome:   zapp_history_72_quantity_extractor

-- Extrai quantidade do texto com regex robusto: "1000 canecas", "1.000 unidades", "mil peças", "200 pç"
CREATE OR REPLACE FUNCTION zapp_history.extract_quantity_from_text(p_text TEXT)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE
AS $fn$
DECLARE
  v_match TEXT;
  v_qty TEXT;
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Padrão 1: número direto seguido de unidade/produto (ex: "200 canecas", "1.000 unidades", "5000 pçs")
  v_match := (regexp_match(v_text_lower, '(\d{1,3}(?:\.\d{3})+|\d{2,6})\s*(unidades?|peças?|peca?s?|pcs?|pç?s?|un|und|itens?|canecas?|canetas?|squeezes?|mochilas?|camisetas?|copos?|brindes?|kits?)'))[1];
  IF v_match IS NOT NULL THEN
    v_qty := replace(v_match, '.', '');
    RETURN v_qty::INTEGER;
  END IF;

  -- Padrão 2: número grande próximo de palavras de pedido
  v_match := (regexp_match(v_text_lower, '(?:quero|preciso|cota[cç][aã]o|or[cç]amento|comprar|encomendar)[^0-9]{0,30}(\d{1,3}(?:\.\d{3})+|\d{2,6})'))[1];
  IF v_match IS NOT NULL THEN
    v_qty := replace(v_match, '.', '');
    RETURN v_qty::INTEGER;
  END IF;

  -- Padrão 3: palavras "mil", "cem", etc
  IF v_text_lower ~ '\m(mil|um mil|1 mil)\M' THEN RETURN 1000; END IF;
  IF v_text_lower ~ '\mcem\M' THEN RETURN 100; END IF;
  IF v_text_lower ~ '\m(duzent[oa]s|200)\M' THEN RETURN 200; END IF;
  IF v_text_lower ~ '\m(quinhent[oa]s|500)\M' THEN RETURN 500; END IF;

  -- Padrão 4: número solto (último recurso)
  v_match := (regexp_match(v_text_lower, '\m(\d{2,6})\M'))[1];
  IF v_match IS NOT NULL THEN
    RETURN v_match::INTEGER;
  END IF;

  RETURN NULL;
END;
$fn$;

-- Extrai prazo/deadline
CREATE OR REPLACE FUNCTION zapp_history.extract_deadline_from_text(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $fn$
DECLARE
  v_text_lower TEXT;
  v_match TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Urgência absoluta
  IF v_text_lower ~ '\m(urgent[ei]|asap|para ontem|imediat[ao]|imediatamente|pra ontem)\M' THEN
    RETURN 'URGENTE';
  END IF;

  -- "em X dias/semanas/meses"
  v_match := (regexp_match(v_text_lower, '(?:em|prazo de|prazo|para entrega em|entrega em|até)\s*(\d+\s*(?:dias?|semanas?|meses?))'))[1];
  IF v_match IS NOT NULL THEN RETURN v_match; END IF;

  -- "até sexta", "até dia X"
  v_match := (regexp_match(v_text_lower, 'at[eé]\s*(segunda|terça|quarta|quinta|sexta|sábado|sabado|domingo|dia\s*\d+|próxim[oa]\s*\w+)'))[1];
  IF v_match IS NOT NULL THEN RETURN 'até ' || v_match; END IF;

  RETURN NULL;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.extract_quantity_from_text(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION zapp_history.extract_deadline_from_text(TEXT) TO authenticated, service_role;
