CREATE OR REPLACE FUNCTION zapp_history.extract_discovery_channel(p_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
