-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409220932
-- nome:   zapp_history_187_credibility_stricter

CREATE OR REPLACE FUNCTION zapp_history.detect_credibility(p_text TEXT, p_phone TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_score INT := 100;
  v_flags TEXT[] := ARRAY[]::TEXT[];
  v_level TEXT;
  v_has_phishing BOOLEAN := FALSE;
  v_has_pedido_dinheiro BOOLEAN := FALSE;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('level','indefinido','score',null); END IF;
  v_text_lower := lower(p_text);

  -- Phishing link combinado com premiação = auto-crítica
  IF v_text_lower ~ '(clique aqui|click here|bit\.ly|tinyurl|encurtador)' THEN
    v_score := v_score - 40; v_flags := array_append(v_flags,'link_suspeito');
  END IF;
  IF v_text_lower ~ '(parab[ée]ns voc[êe] (ganhou|foi premiad)|voc[êe] foi sorteado|pr[êe]mio)' THEN
    v_score := v_score - 50; v_flags := array_append(v_flags,'sorteio_falso');
    v_has_phishing := TRUE;
  END IF;
  IF v_text_lower ~ '(pix urgente|me ajuda com pix|empr[ée]stimo|preciso de dinheiro|sou da fam[íi]lia)' THEN
    v_score := v_score - 70; v_flags := array_append(v_flags,'pedido_dinheiro');
    v_has_pedido_dinheiro := TRUE;
  END IF;
  IF v_text_lower ~ '(cart[ãa]o (clonado|bloqueado)|conta (bloqueada|suspensa)|verifica[çc][ãa]o de seguran[çc]a)' THEN
    v_score := v_score - 70; v_flags := array_append(v_flags,'phishing');
    v_has_phishing := TRUE;
  END IF;

  -- Combinação mortal: link + prêmio = crítica automática
  IF v_has_phishing AND v_text_lower ~ '(clique|click|bit\.ly|link|http)' THEN
    v_score := LEAST(v_score, 15);
    v_flags := array_append(v_flags,'combo_phishing_link');
  END IF;

  IF p_text ~* '^\s*https?://\S+\s*$' THEN
    v_score := v_score - 25; v_flags := array_append(v_flags,'so_link');
  END IF;

  IF length(p_text) < 5 THEN v_score := v_score - 15; v_flags := array_append(v_flags,'muito_curta'); END IF;

  IF length(p_text) > 30 AND length(regexp_replace(p_text, '[^A-Z]', '', 'g'))::numeric / length(p_text) > 0.7 THEN
    v_score := v_score - 10; v_flags := array_append(v_flags,'caps_excessivo');
  END IF;

  IF v_text_lower ~ '^(teste|test|testando|hello world|asdf|asdfg)\.?\s*$' THEN
    v_score := v_score - 60; v_flags := array_append(v_flags,'mensagem_teste');
  END IF;

  IF p_phone IS NOT NULL AND p_phone !~ '^55' THEN
    v_score := v_score - 5; v_flags := array_append(v_flags,'telefone_internacional');
  END IF;

  IF v_score < 0 THEN v_score := 0; END IF;

  v_level := CASE
    WHEN v_score >= 80 THEN 'alta'
    WHEN v_score >= 55 THEN 'media'
    WHEN v_score >= 25 THEN 'baixa'
    ELSE 'critica_spam'
  END;

  RETURN jsonb_build_object('level', v_level, 'score', v_score, 'flags', to_jsonb(v_flags));
END;
$fn$;

-- Re-aplica nas mensagens v186 de spam e roda trigger de quarentena
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT m.id, m.content, regexp_replace(c.remote_jid, '@.*', '') AS phone
    FROM zapp_history.messages m
    JOIN zapp_history.conversations c ON c.id = m.conversation_id
    WHERE m.whatsapp_message_id IN ('_v186_005','_v186_006')
  LOOP
    UPDATE zapp_history.messages
    SET credibility = zapp_history.detect_credibility(r.content, r.phone)
    WHERE id = r.id;

    UPDATE zapp_history.messages
    SET quarantined = TRUE,
        quarantine_reason = 'Backfill: ' || (credibility->>'flags')
    WHERE id = r.id AND credibility->>'level' = 'critica_spam';
  END LOOP;
END $$;

SELECT whatsapp_message_id, credibility->>'level' AS cred, credibility->>'score' AS score, quarantined
FROM zapp_history.messages
WHERE whatsapp_message_id IN ('_v186_005','_v186_006')
ORDER BY whatsapp_message_id;
