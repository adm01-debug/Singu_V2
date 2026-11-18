-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409144048
-- nome:   zapp_history_82_discovery_channel_detector

CREATE OR REPLACE FUNCTION zapp_history.extract_discovery_channel(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '\m(google|pesquis(ei|ando)|busqu(ei|ando)|encontrei no google)\M' THEN RETURN 'google'; END IF;
  IF v_text_lower ~ '\m(instagram|insta|reels|story)\M' THEN RETURN 'instagram'; END IF;
  IF v_text_lower ~ '\mfacebook\M|\mfb\M' THEN RETURN 'facebook'; END IF;
  IF v_text_lower ~ '\mlinkedin\M' THEN RETURN 'linkedin'; END IF;
  IF v_text_lower ~ '\m(tiktok|tik tok)\M' THEN RETURN 'tiktok'; END IF;
  IF v_text_lower ~ '\m(youtube|yt)\M' THEN RETURN 'youtube'; END IF;
  IF v_text_lower ~ '\m(indica[çc][ãa]o|indicado por|me indicaram|amig[oa] me passou)\M' THEN RETURN 'indicacao'; END IF;
  IF v_text_lower ~ '\m(site|website|p[áa]gina de voc[êe]s)\M' THEN RETURN 'site'; END IF;
  IF v_text_lower ~ '\m(feira|evento|expo)\M' THEN RETURN 'evento_offline'; END IF;
  IF v_text_lower ~ '\m(j[áa] (sou cliente|comprei|fui cliente)|recomprar|recompra|nova compra)\M' THEN RETURN 'cliente_recorrente'; END IF;
  IF v_text_lower ~ '\m(email marketing|newsletter|email de voc[êe]s)\M' THEN RETURN 'email_mkt'; END IF;
  IF v_text_lower ~ '\m(an[úu]ncio|ads|campanha)\M' THEN RETURN 'paid_ads'; END IF;

  RETURN NULL;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS discovery_channel TEXT,
  ADD COLUMN IF NOT EXISTS budget_detected NUMERIC;

CREATE INDEX IF NOT EXISTS idx_messages_discovery ON zapp_history.messages(discovery_channel) WHERE discovery_channel IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_budget ON zapp_history.messages(budget_detected DESC NULLS LAST) WHERE budget_detected IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.extract_discovery_channel(TEXT) TO authenticated, service_role;
