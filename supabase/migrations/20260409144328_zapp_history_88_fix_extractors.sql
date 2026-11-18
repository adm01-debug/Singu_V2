-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409144328
-- nome:   zapp_history_88_fix_extractors

-- Budget: tratar "X mil" antes de R$ comum, e número direto sem ponto separador
CREATE OR REPLACE FUNCTION zapp_history.extract_budget_from_text(p_text TEXT)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_match TEXT;
  v_clean TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Padrão 1: "R$ X mil" / "X mil reais" / "verba de X mil" → multiplica por 1000
  v_match := (regexp_match(v_text_lower, '(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*mil(?:\s*reais?)?'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(v_match, ',', '.');
    RETURN (v_clean::NUMERIC) * 1000;
  END IF;

  -- Padrão 2: R$ X.XXX,XX (com separador de milhar)
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  -- Padrão 3: R$ XXXXX (sem separador, valor inteiro grande)
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d{4,8})'))[1];
  IF v_match IS NOT NULL THEN
    RETURN v_match::NUMERIC;
  END IF;

  -- Padrão 4: "orçamento de R$ X" / "verba aprovada de R$ X" / "investimento de"
  v_match := (regexp_match(v_text_lower, '(?:or[cç]amento|verba|investimento|valor|gasto|budget)[^0-9]{0,30}r?\$?\s*(\d{1,3}(?:[\.,]\d{3})+(?:,\d{2})?|\d{3,8})'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  RETURN NULL;
END;
$fn$;

-- Discovery channel: incluir "fui indicado", "me indicaram", "indicado pelo"
CREATE OR REPLACE FUNCTION zapp_history.extract_discovery_channel(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- ORDEM IMPORTA: indicação primeiro pra não cair em google
  IF v_text_lower ~ '(indica[çc][ãa]o|indicado pel[oa]|me indicaram|amig[oa] me passou|me passou seu contato|fui indicad[oa])' THEN
    RETURN 'indicacao';
  END IF;

  IF v_text_lower ~ '\m(j[áa] sou cliente|j[áa] comprei|fui cliente|recompr(ar?|a)|nova compra|cliente antig[oa])\M' THEN
    RETURN 'cliente_recorrente';
  END IF;

  IF v_text_lower ~ '\m(google|pesquis(ei|ando)|busqu(ei|ando)|encontrei no google)\M' THEN RETURN 'google'; END IF;
  IF v_text_lower ~ '\m(instagram|insta|reels|story|stories)\M' THEN RETURN 'instagram'; END IF;
  IF v_text_lower ~ '\mfacebook\M|\mfb\M' THEN RETURN 'facebook'; END IF;
  IF v_text_lower ~ '\mlinkedin\M' THEN RETURN 'linkedin'; END IF;
  IF v_text_lower ~ '\m(tiktok|tik tok)\M' THEN RETURN 'tiktok'; END IF;
  IF v_text_lower ~ '\m(youtube|yt)\M' THEN RETURN 'youtube'; END IF;
  IF v_text_lower ~ '\m(site|website|p[áa]gina de voc[êe]s)\M' THEN RETURN 'site'; END IF;
  IF v_text_lower ~ '\m(feira|evento|expo|conheci voc[êe]s na)\M' THEN RETURN 'evento_offline'; END IF;
  IF v_text_lower ~ '\m(email marketing|newsletter|email de voc[êe]s)\M' THEN RETURN 'email_mkt'; END IF;
  IF v_text_lower ~ '\m(an[úu]ncio|ads|campanha)\M' THEN RETURN 'paid_ads'; END IF;

  RETURN NULL;
END;
$fn$;

-- Backfill: re-extrai budget e channel das mensagens do teste
UPDATE zapp_history.messages
SET
  budget_detected = zapp_history.extract_budget_from_text(content),
  discovery_channel = zapp_history.extract_discovery_channel(content)
WHERE whatsapp_message_id LIKE '\_v87\_%' ESCAPE '\';

-- Recalcula scores
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM zapp_history.messages WHERE whatsapp_message_id LIKE '\_v87\_%' ESCAPE '\'
  LOOP
    PERFORM zapp_history.calculate_lead_score(r.id);
  END LOOP;
END $$;
