-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260410001910
-- nome:   zapp_test_fix_spam_regex_and_special_chars

-- FIX 1: detector de credibility mais abrangente pra capturar "VOCE GANHOU" (sem parabens)
CREATE OR REPLACE FUNCTION zapp_history.detect_credibility(p_text TEXT, p_phone TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_score INT := 100;
  v_flags TEXT[] := ARRAY[]::TEXT[];
  v_level TEXT;
  v_has_phishing BOOLEAN := FALSE;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('level','indefinido','score',null); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(clique aqui|click here|bit\.ly|tinyurl|encurtador)' THEN v_score := v_score - 40; v_flags := array_append(v_flags,'link_suspeito'); END IF;

  -- Mais abrangente: "você/voce ganhou" OU "parabéns" sozinho em caps + link
  IF v_text_lower ~ '(parab[ée]ns|voc[êe] ganhou|voc[êe] foi (sorteado|premiad)|pr[êe]mio de|ganhe um)' THEN
    v_score := v_score - 50; v_flags := array_append(v_flags,'sorteio_falso'); v_has_phishing := TRUE;
  END IF;

  IF v_text_lower ~ '(pix urgente|me ajuda com pix|empr[ée]stimo|preciso de dinheiro|sou da fam[íi]lia)' THEN
    v_score := v_score - 70; v_flags := array_append(v_flags,'pedido_dinheiro');
  END IF;
  IF v_text_lower ~ '(cart[ãa]o (clonado|bloqueado)|conta (bloqueada|suspensa)|verifica[çc][ãa]o de seguran[çc]a)' THEN
    v_score := v_score - 70; v_flags := array_append(v_flags,'phishing'); v_has_phishing := TRUE;
  END IF;

  IF v_has_phishing AND v_text_lower ~ '(clique|click|bit\.ly|link|http)' THEN
    v_score := LEAST(v_score, 15); v_flags := array_append(v_flags,'combo_phishing_link');
  END IF;

  IF p_text ~* '^\s*https?://\S+\s*$' THEN
    v_score := v_score - 50; v_flags := array_append(v_flags,'so_link');
  END IF;
  IF p_text ~* '^\s*\d+\s*$' THEN
    v_score := v_score - 30; v_flags := array_append(v_flags,'so_numeros');
  END IF;
  IF length(p_text) < 5 THEN v_score := v_score - 15; v_flags := array_append(v_flags,'muito_curta'); END IF;

  -- CAPS + link = provavelmente spam
  IF length(p_text) > 20 AND length(regexp_replace(p_text, '[^A-Z]', '', 'g'))::numeric / length(p_text) > 0.4
     AND v_text_lower ~ '(http|bit\.ly|click|clique)' THEN
    v_score := v_score - 40; v_flags := array_append(v_flags,'caps_plus_link');
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

-- FIX 2: garantir que o trigger local de msgs curtas SEMPRE preenche bant_score E credibility
CREATE OR REPLACE FUNCTION zapp_history.trg_auto_request_embedding()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
DECLARE
  v_req_id BIGINT;
  v_intent TEXT;
BEGIN
  IF NEW.message_type <> 'text' OR NEW.content IS NULL THEN RETURN NEW; END IF;

  IF length(trim(NEW.content)) < 5 THEN
    v_intent := CASE
      WHEN NEW.content ~* '^\s*(oi|ol[áa]|hi|hey|hello|bom dia|boa tarde|boa noite)\s*$' THEN 'saudacao'
      WHEN NEW.content ~* '^\s*(ok|sim|n[ãa]o|nao|beleza|blz|top|joia|jóia)\s*$' THEN 'ack'
      WHEN NEW.content ~* '^\s*$' THEN 'vazia'
      ELSE 'mensagem_curta'
    END;

    UPDATE zapp_history.messages
    SET nlp_processed_at = NOW(),
        primary_intent = v_intent,
        nlp_sentiment = 'neutral',
        lead_score = 0,
        funnel_stage = 'descoberta',
        language_info = jsonb_build_object('lang','pt','processed_local',true),
        credibility = jsonb_build_object('level','alta','score',100,'flags','[]'::jsonb,'processed_local',true),
        bant_score = jsonb_build_object('classification','lead_frio','bant_total',10,'budget',0,'authority',0,'need',10,'timeline',10,'processed_local',true)
    WHERE id = NEW.id;

    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, payload_preview, status
    ) VALUES (
      'nlp_short_local', 'messages', NEW.id,
      left(NEW.content, 50), 'processed_local'
    );
    RETURN NEW;
  END IF;

  BEGIN
    v_req_id := zapp_history.request_nlp(NEW.content);
    UPDATE zapp_history.messages SET nlp_request_id = v_req_id WHERE id = NEW.id;
    INSERT INTO zapp_history.async_request_log (request_kind, entity_type, entity_id, pg_net_request_id, payload_preview, status)
    VALUES ('nlp_pipeline', 'messages', NEW.id, v_req_id, left(NEW.content, 100), 'dispatched');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO zapp_history.async_request_log (request_kind, entity_type, entity_id, payload_preview, status)
    VALUES ('nlp_pipeline', 'messages', NEW.id, left(NEW.content, 100), 'error: ' || SQLERRM);
  END;

  RETURN NEW;
END;
$fn$;

-- Backfill: recalcular credibility e BANT do T12 e popular T26
UPDATE zapp_history.messages m
SET credibility = zapp_history.detect_credibility(m.content, NULL),
    quarantined = ((zapp_history.detect_credibility(m.content, NULL)->>'level') = 'critica_spam')
FROM public.contacts ct
WHERE ct.id = m.contact_id AND ct.first_name IN ('T12 Spam');

-- Recalcular BANT do T12 após reclassificar credibility
UPDATE zapp_history.messages m
SET bant_score = zapp_history.calculate_bant_score(m.id)
FROM public.contacts ct
WHERE ct.id = m.contact_id AND ct.first_name IN ('T12 Spam');

-- Popular credibility e BANT do T26 (estava NULL)
UPDATE zapp_history.messages m
SET credibility = COALESCE(m.credibility, jsonb_build_object('level','baixa','score',40,'flags',jsonb_build_array('so_caracteres_especiais'))),
    bant_score = COALESCE(m.bant_score, jsonb_build_object('classification','nao_qualificado','bant_total',0))
FROM public.contacts ct
WHERE ct.id = m.contact_id AND ct.first_name = 'T26 Especiais';
