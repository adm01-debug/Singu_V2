-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409220528
-- nome:   zapp_history_183_credibility_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_credibility(p_text TEXT, p_phone TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_score INT := 100;
  v_flags TEXT[] := ARRAY[]::TEXT[];
  v_level TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('level','indefinido','score',null); END IF;
  v_text_lower := lower(p_text);

  -- Sinais de spam / scam
  IF v_text_lower ~ '(clique aqui|click here|bit\.ly|tinyurl|encurtador)' THEN v_score := v_score - 30; v_flags := array_append(v_flags,'link_suspeito'); END IF;
  IF v_text_lower ~ '(parab[ée]ns voc[êe] (ganhou|foi premiad)|voc[êe] foi sorteado|pr[êe]mio)' THEN v_score := v_score - 40; v_flags := array_append(v_flags,'sorteio_falso'); END IF;
  IF v_text_lower ~ '(pix urgente|me ajuda com pix|empr[ée]stimo|preciso de dinheiro|sou da fam[íi]lia)' THEN v_score := v_score - 50; v_flags := array_append(v_flags,'pedido_dinheiro'); END IF;
  IF v_text_lower ~ '(cart[ãa]o (clonado|bloqueado)|conta (bloqueada|suspensa)|verifica[çc][ãa]o de seguran[çc]a)' THEN v_score := v_score - 50; v_flags := array_append(v_flags,'phishing'); END IF;

  -- Mensagem só com link ou só números
  IF length(regexp_replace(p_text, '\s', '', 'g')) > 0 AND p_text ~* '^\s*https?://\S+\s*$' THEN
    v_score := v_score - 25; v_flags := array_append(v_flags,'so_link');
  END IF;

  -- Mensagem muito curta sem contexto
  IF length(p_text) < 5 THEN v_score := v_score - 15; v_flags := array_append(v_flags,'muito_curta'); END IF;

  -- CAPS lock total (gritando, suspeito)
  IF length(p_text) > 30 AND length(regexp_replace(p_text, '[^A-Z]', '', 'g'))::numeric / length(p_text) > 0.7 THEN
    v_score := v_score - 10; v_flags := array_append(v_flags,'caps_excessivo');
  END IF;

  -- Mensagens de teste óbvio
  IF v_text_lower ~ '^(teste|test|testando|hello world|asdf|asdfg)\.?\s*$' THEN
    v_score := v_score - 60; v_flags := array_append(v_flags,'mensagem_teste');
  END IF;

  -- Telefone DDI suspeito (não-Brasil sem contexto B2B)
  IF p_phone IS NOT NULL AND p_phone !~ '^55' THEN
    v_score := v_score - 5; v_flags := array_append(v_flags,'telefone_internacional');
  END IF;

  IF v_score < 0 THEN v_score := 0; END IF;

  v_level := CASE
    WHEN v_score >= 80 THEN 'alta'
    WHEN v_score >= 50 THEN 'media'
    WHEN v_score >= 25 THEN 'baixa'
    ELSE 'critica_spam'
  END;

  RETURN jsonb_build_object('level', v_level, 'score', v_score, 'flags', to_jsonb(v_flags));
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS credibility JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_credibility ON zapp_history.messages((credibility->>'level')) WHERE credibility IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_credibility(TEXT, TEXT) TO authenticated, service_role;
