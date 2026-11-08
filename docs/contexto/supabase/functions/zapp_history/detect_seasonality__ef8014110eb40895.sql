CREATE OR REPLACE FUNCTION zapp_history.detect_seasonality(p_text text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_seasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN v_seasons; END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(natal|fim de ano|dezembro|presente de natal|festas de fim)' THEN v_seasons := array_append(v_seasons,'natal'); END IF;
  IF v_text_lower ~ '(black ?friday|cyber monday)' THEN v_seasons := array_append(v_seasons,'black_friday'); END IF;
  IF v_text_lower ~ '(dia das m[ãa]es|m[ãa]e)' THEN v_seasons := array_append(v_seasons,'dia_das_maes'); END IF;
  IF v_text_lower ~ '(dia dos pais|pai)' THEN v_seasons := array_append(v_seasons,'dia_dos_pais'); END IF;
  IF v_text_lower ~ '(dia dos namorados|valentine|namorad[oa])' THEN v_seasons := array_append(v_seasons,'namorados'); END IF;
  IF v_text_lower ~ '(dia das crian[çc]as|crian[çc]a)' THEN v_seasons := array_append(v_seasons,'dia_das_criancas'); END IF;
  IF v_text_lower ~ '(p[áa]scoa|coelho|chocolate)' THEN v_seasons := array_append(v_seasons,'pascoa'); END IF;
  IF v_text_lower ~ '(carnaval|bloco|folia)' THEN v_seasons := array_append(v_seasons,'carnaval'); END IF;
  IF v_text_lower ~ '(festa junina|s[ãa]o jo[ãa]o|arrai[áa])' THEN v_seasons := array_append(v_seasons,'festa_junina'); END IF;
  IF v_text_lower ~ '(volta [àa]s aulas|in[íi]cio (do |de )ano letivo|material escolar)' THEN v_seasons := array_append(v_seasons,'volta_aulas'); END IF;
  IF v_text_lower ~ '(formatura|colação|formand[oa])' THEN v_seasons := array_append(v_seasons,'formatura'); END IF;
  IF v_text_lower ~ '(virada do ano|ano novo|reveillon)' THEN v_seasons := array_append(v_seasons,'reveillon'); END IF;

  RETURN v_seasons;
END;
$function$
