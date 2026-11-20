-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409222216
-- nome:   zapp_history_192_seasonality

CREATE OR REPLACE FUNCTION zapp_history.detect_seasonality(p_text TEXT)
RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE AS $fn$
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
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS seasonality TEXT[];
CREATE INDEX IF NOT EXISTS idx_messages_seasonality ON zapp_history.messages USING GIN (seasonality)
  WHERE seasonality IS NOT NULL AND array_length(seasonality, 1) > 0;

GRANT EXECUTE ON FUNCTION zapp_history.detect_seasonality(TEXT) TO authenticated, service_role;
