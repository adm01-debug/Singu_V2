-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409220503
-- nome:   zapp_history_182_hesitation_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_hesitation(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_score INT := 0;
  v_signals TEXT[] := ARRAY[]::TEXT[];
  v_level TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('level','none','score',0); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '\m(talvez|quem sabe|n[ãa]o sei (ainda|bem)|acho que|pode ser|vou ver|deixa eu pensar|preciso pensar)\M' THEN
    v_score := v_score + 3; v_signals := array_append(v_signals,'duvida_explicita');
  END IF;
  IF v_text_lower ~ '\m(\.\.\.|hmm|aff|sei l[áa])\M' OR p_text ~ '\.{3,}' THEN
    v_score := v_score + 2; v_signals := array_append(v_signals,'reticencias_hesitacao');
  END IF;
  IF v_text_lower ~ '\m(qualquer coisa (eu )?(volto|aviso)|depois eu (vejo|falo|retorno)|aviso depois|te aviso)\M' THEN
    v_score := v_score + 4; v_signals := array_append(v_signals,'adiamento');
  END IF;
  IF v_text_lower ~ '\m(será que|valeria a pena|compensa|vale (a pena|mesmo))\M' THEN
    v_score := v_score + 3; v_signals := array_append(v_signals,'questionando_valor');
  END IF;
  IF v_text_lower ~ '\m(ainda estou (vendo|comparando|analisando)|preciso comparar|vendo outras op[çc][õo]es)\M' THEN
    v_score := v_score + 3; v_signals := array_append(v_signals,'comparando');
  END IF;
  IF v_text_lower ~ '\m(meu marido|minha esposa|s[óo]cio|fam[íi]lia precisa aprovar|preciso conversar)\M' THEN
    v_score := v_score + 2; v_signals := array_append(v_signals,'precisa_consultar');
  END IF;

  v_level := CASE
    WHEN v_score >= 7 THEN 'alta'
    WHEN v_score >= 4 THEN 'media'
    WHEN v_score > 0 THEN 'baixa'
    ELSE 'none'
  END;

  RETURN jsonb_build_object('level', v_level, 'score', v_score, 'signals', to_jsonb(v_signals));
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS hesitation JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_hesitation ON zapp_history.messages((hesitation->>'level')) WHERE hesitation IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_hesitation(TEXT) TO authenticated, service_role;
