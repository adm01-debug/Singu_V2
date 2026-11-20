-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409220443
-- nome:   zapp_history_181_language_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_language(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_pt INT := 0;
  v_en INT := 0;
  v_es INT := 0;
  v_lang TEXT;
  v_dialect TEXT := NULL;
BEGIN
  IF p_text IS NULL OR length(p_text) < 5 THEN RETURN jsonb_build_object('lang','indefinido'); END IF;
  v_text_lower := lower(p_text);

  -- Português
  IF v_text_lower ~ '\m(você|voce|não|nao|está|esta|obrigad[oa]|olá|ola|por favor|preciso|quero|tem|fa[zç]er|com|para|pra|que|qual|quando|onde|como)\M' THEN v_pt := v_pt + 5; END IF;
  IF v_text_lower ~ '(ção|ões|ãos|nh|lh)' THEN v_pt := v_pt + 3; END IF;

  -- Inglês
  IF v_text_lower ~ '\m(the|and|you|please|need|want|have|with|for|what|when|where|how|hello|hi|thanks|thank you)\M' THEN v_en := v_en + 5; END IF;
  IF v_text_lower ~ '\m(would|could|should|will|can|may)\M' THEN v_en := v_en + 2; END IF;

  -- Espanhol
  IF v_text_lower ~ '\m(usted|tú|tu|necesito|quiero|tengo|con|para|qué|cuándo|dónde|cómo|hola|gracias|por favor)\M' THEN v_es := v_es + 5; END IF;
  IF v_text_lower ~ '(ción|ñ)' THEN v_es := v_es + 3; END IF;

  IF v_pt >= v_en AND v_pt >= v_es THEN v_lang := 'pt';
  ELSIF v_en >= v_es THEN v_lang := 'en';
  ELSE v_lang := 'es';
  END IF;

  -- Detecta dialeto/região (apenas pt-BR)
  IF v_lang = 'pt' THEN
    IF v_text_lower ~ '\m(bah|tchê|guri|guria|piá)\M' THEN v_dialect := 'gaucho';
    ELSIF v_text_lower ~ '\m(uai|trem|sô|trem bão)\M' THEN v_dialect := 'mineiro';
    ELSIF v_text_lower ~ '\m(visse|oxe|vixe|massa)\M' THEN v_dialect := 'nordestino';
    ELSIF v_text_lower ~ '\m(mano|tipo assim|véi|mlk)\M' THEN v_dialect := 'paulista';
    ELSIF v_text_lower ~ '\m(maneiro|caraca|mermão|sinistro)\M' THEN v_dialect := 'carioca';
    END IF;
  END IF;

  RETURN jsonb_build_object('lang', v_lang, 'dialect', v_dialect, 'pt_score', v_pt, 'en_score', v_en, 'es_score', v_es);
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS language_info JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_lang ON zapp_history.messages((language_info->>'lang')) WHERE language_info IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_language(TEXT) TO authenticated, service_role;
