-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225043
-- nome:   zapp_history_213_referral_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_referral_source(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_source TEXT := NULL;
  v_referrer TEXT := NULL;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('source',null); END IF;
  v_text_lower := lower(p_text);

  -- Indicação de pessoa
  IF v_text_lower ~ '(fulano|beltrano|me indicou|indica[çc][ãa]o do|indicado pel|amigo (me )?(falou|indicou)|colega (indicou|falou))' THEN
    v_source := 'indicacao_pessoa';
    -- Tenta extrair nome após "indicou"
    v_referrer := substring(v_text_lower FROM '(?:indicou|indica[çc][ãa]o do|indicado pelo?|indicou voc[êe]s)\s+([a-záêç]+(?:\s+[a-záêç]+)?)');
  ELSIF v_text_lower ~ '(j[áa] comprei aqui|sou cliente|cliente antig[oa]|j[áa] fiz pedido)' THEN v_source := 'cliente_recorrente';
  ELSIF v_text_lower ~ '(google|pesquisei no google|busca do google)' THEN v_source := 'google_organico';
  ELSIF v_text_lower ~ '(an[úu]ncio|anuncio|vi o an[úu]ncio|propaganda)' THEN v_source := 'ads_pago';
  ELSIF v_text_lower ~ '(instagram|insta|@|perfil de voc[êe]s)' THEN v_source := 'instagram';
  ELSIF v_text_lower ~ '(facebook|face)' THEN v_source := 'facebook';
  ELSIF v_text_lower ~ '(linkedin)' THEN v_source := 'linkedin';
  ELSIF v_text_lower ~ '(tiktok|tik tok)' THEN v_source := 'tiktok';
  ELSIF v_text_lower ~ '(youtube|canal de)' THEN v_source := 'youtube';
  ELSIF v_text_lower ~ '(feira|evento|expo|congresso)' THEN v_source := 'evento_fisico';
  ELSIF v_text_lower ~ '(site de voc[êe]s|seu site)' THEN v_source := 'site_proprio';
  END IF;

  IF v_source IS NULL THEN RETURN jsonb_build_object('source', null); END IF;
  RETURN jsonb_build_object('source', v_source, 'referrer', v_referrer);
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS referral_source JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_referral ON zapp_history.messages((referral_source->>'source'))
  WHERE referral_source IS NOT NULL;
GRANT EXECUTE ON FUNCTION zapp_history.detect_referral_source(TEXT) TO authenticated, service_role;
