-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409183521
-- nome:   zapp_history_127b_fix_emoji_regex

CREATE OR REPLACE FUNCTION zapp_history.detect_communication_tone(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_formal_score INT := 0;
  v_informal_score INT := 0;
  v_tone TEXT;
  v_emoji_count INT;
  v_caps_ratio NUMERIC;
  v_word_count INT;
  v_byte_len INT;
  v_char_len INT;
BEGIN
  IF p_text IS NULL OR length(p_text) < 5 THEN
    RETURN jsonb_build_object('tone','indefinido','formality',null);
  END IF;

  v_text_lower := lower(p_text);
  v_word_count := array_length(string_to_array(p_text, ' '), 1);

  -- Sinais de formalidade
  IF v_text_lower ~ '(prezado|prezada|cordialmente|atenciosamente|venho por meio|gostaria de solicitar|certo de sua aten[çc][ãa]o)' THEN v_formal_score := v_formal_score + 3; END IF;
  IF v_text_lower ~ '(boa tarde|bom dia|boa noite)' THEN v_formal_score := v_formal_score + 1; END IF;
  IF v_text_lower ~ '(senhor|senhora|sr\.|sra\.)' THEN v_formal_score := v_formal_score + 2; END IF;
  IF v_text_lower ~ '(empresa|departamento|gestor|diretor|comercial|setor)' THEN v_formal_score := v_formal_score + 1; END IF;

  -- Sinais de informalidade
  IF v_text_lower ~ '\m(oi|olá|opa|fala|eai|e ai|eaí|salve|blz|tranquilo|tranquilow)\M' THEN v_informal_score := v_informal_score + 2; END IF;
  IF v_text_lower ~ '\m(vc|vcs|tb|tbm|pq|qto|td|cmg|tmj|flw|vlw)\M' THEN v_informal_score := v_informal_score + 3; END IF;
  IF v_text_lower ~ 'k{3,}' THEN v_informal_score := v_informal_score + 2; END IF;
  IF v_text_lower ~ '\m(mano|cara|brother|amigo|parça|chefe)\M' THEN v_informal_score := v_informal_score + 2; END IF;

  -- Conta emojis: diferença entre tamanho em bytes (UTF-8 multibyte) e tamanho em chars
  -- Emojis ocupam 4 bytes em UTF-8, ASCII ocupa 1
  v_byte_len := octet_length(p_text);
  v_char_len := length(p_text);
  v_emoji_count := GREATEST(0, ((v_byte_len - v_char_len) / 3)::INT);
  IF v_emoji_count >= 1 THEN v_informal_score := v_informal_score + v_emoji_count; END IF;

  -- Ratio de CAPS
  IF length(p_text) >= 20 THEN
    v_caps_ratio := (length(regexp_replace(p_text, '[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]', '', 'g'))::numeric / length(p_text))::numeric(5,3);
  ELSE
    v_caps_ratio := 0;
  END IF;

  IF v_formal_score > v_informal_score THEN
    v_tone := 'formal';
  ELSIF v_informal_score > v_formal_score THEN
    v_tone := 'informal';
  ELSE
    v_tone := 'neutro';
  END IF;

  RETURN jsonb_build_object(
    'tone', v_tone,
    'formal_score', v_formal_score,
    'informal_score', v_informal_score,
    'emoji_count', v_emoji_count,
    'caps_ratio', v_caps_ratio,
    'word_count', v_word_count,
    'is_screaming', v_caps_ratio > 0.5
  );
END;
$fn$;

-- Re-roda
SELECT * FROM zapp_history.reconcile_nlp_responses();
