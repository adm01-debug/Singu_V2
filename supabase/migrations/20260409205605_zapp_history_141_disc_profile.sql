-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205605
-- nome:   zapp_history_141_disc_profile

CREATE OR REPLACE FUNCTION zapp_history.detect_disc_profile(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_d INT := 0; v_i INT := 0; v_s INT := 0; v_c INT := 0;
  v_dominant TEXT;
BEGIN
  IF p_text IS NULL OR length(p_text) < 10 THEN
    RETURN jsonb_build_object('profile','indefinido');
  END IF;
  v_text_lower := lower(p_text);

  -- D (Dominante): direto, focado em resultado, urgente, decidido, comando
  IF v_text_lower ~ '(quero|preciso|me manda|fa[cz]|urgente|pra ontem|r[áa]pido|direto|objetivo|pode produzir|fechado|resolve)' THEN v_d := v_d + 2; END IF;
  IF v_text_lower ~ '(decis[ãa]o|decidido|definido|sem rodeio|vamos l[áa])' THEN v_d := v_d + 3; END IF;
  IF v_text_lower ~ '(quanto custa|qual o pre[cç]o|me manda valor)' THEN v_d := v_d + 1; END IF;

  -- I (Influente): social, entusiasmo, emojis, expressivo, conversa
  IF v_text_lower ~ '(adorei|amei|maravilh|incr[íi]vel|top|massa|legal|bacana|que demais|nossa)' THEN v_i := v_i + 3; END IF;
  IF v_text_lower ~ '(gostaria muito|estou super|empolgad[oa]|animad[oa]|ansios[oa])' THEN v_i := v_i + 2; END IF;
  IF p_text ~ '!{2,}' OR octet_length(p_text) - length(p_text) > 0 THEN v_i := v_i + 2; END IF; -- emojis ou múltiplos !
  IF v_text_lower ~ '(amig[oa]|querid[oa]|pessoal|gente|galera)' THEN v_i := v_i + 2; END IF;

  -- S (Estável): paciente, educado, formal, busca relacionamento, pergunta sobre confiança
  IF v_text_lower ~ '(prezad[oa]|atenciosamente|cordialmente|por gentileza|por favor|se poss[íi]vel|quando puder)' THEN v_s := v_s + 3; END IF;
  IF v_text_lower ~ '(parceria|relacionamento|longo prazo|confian[çc]a|tranquil[oa])' THEN v_s := v_s + 2; END IF;
  IF v_text_lower ~ '(gostaria de saber|poderia me explicar|gostaria de entender)' THEN v_s := v_s + 2; END IF;

  -- C (Cauteloso/Conformista): técnico, especificações, dúvidas, comparativo, dados
  IF v_text_lower ~ '(especifica[çc][ãa]o|ficha t[ée]cnica|dimens[ãaõ]o|gramatura|material|composi[çc][ãa]o)' THEN v_c := v_c + 3; END IF;
  IF v_text_lower ~ '(certifica[çc][ãa]o|garantia|nota fiscal|contrato|cl[áa]usula|prazo de garantia)' THEN v_c := v_c + 3; END IF;
  IF v_text_lower ~ '(comparativo|qual a diferen[cç]a|pr[óo]s e contras|por que|qual o motivo)' THEN v_c := v_c + 2; END IF;
  IF v_text_lower ~ '(amostra|prot[óo]tipo|teste|aprova[çc][ãa]o de arte|prova digital)' THEN v_c := v_c + 2; END IF;

  -- Dominante
  v_dominant := CASE GREATEST(v_d, v_i, v_s, v_c)
    WHEN 0 THEN 'indefinido'
    WHEN v_d THEN 'D'
    WHEN v_i THEN 'I'
    WHEN v_s THEN 'S'
    WHEN v_c THEN 'C'
  END;

  RETURN jsonb_build_object(
    'profile', v_dominant,
    'D', v_d, 'I', v_i, 'S', v_s, 'C', v_c,
    'description', CASE v_dominant
      WHEN 'D' THEN 'Dominante - decidido, direto, foco em resultado'
      WHEN 'I' THEN 'Influente - social, expressivo, entusiasmado'
      WHEN 'S' THEN 'Estável - paciente, formal, busca relacionamento'
      WHEN 'C' THEN 'Cauteloso - técnico, analítico, busca dados'
      ELSE 'Indefinido'
    END
  );
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS disc_profile JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_disc ON zapp_history.messages((disc_profile->>'profile'))
  WHERE disc_profile IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_disc_profile(TEXT) TO authenticated, service_role;
