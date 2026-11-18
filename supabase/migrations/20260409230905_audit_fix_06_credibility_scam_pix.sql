-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230905
-- nome:   audit_fix_06_credibility_scam_pix

CREATE OR REPLACE FUNCTION zapp_history.detect_credibility(p_text TEXT, p_phone TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_score INT := 100;
  v_flags TEXT[] := ARRAY[]::TEXT[];
  v_level TEXT;
  v_has_phishing BOOLEAN := FALSE;
  v_has_pix_scam BOOLEAN := FALSE;
  v_has_family_scam BOOLEAN := FALSE;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('level','indefinido','score',null); END IF;
  v_text_lower := lower(p_text);

  -- Link suspeito
  IF v_text_lower ~ '(clique aqui|click here|bit\.ly|tinyurl|encurtador)' THEN
    v_score := v_score - 40; v_flags := array_append(v_flags,'link_suspeito');
  END IF;
  -- Sorteio falso
  IF v_text_lower ~ '(parab[ée]ns voc[êe] (ganhou|foi premiad)|voc[êe] foi sorteado|pr[êe]mio)' THEN
    v_score := v_score - 50; v_flags := array_append(v_flags,'sorteio_falso');
    v_has_phishing := TRUE;
  END IF;
  -- Pix urgente
  IF v_text_lower ~ '(pix urgente|me ajuda com pix|me manda um pix|empr[ée]stimo)' THEN
    v_score := v_score - 70; v_flags := array_append(v_flags,'pix_urgente_scam');
    v_has_pix_scam := TRUE;
  END IF;
  -- "Sou da família"
  IF v_text_lower ~ '(sou (da |do )?(fam[íi]lia|filho|filha|neto|neta|primo|prima)|sou teu parente)' THEN
    v_score := v_score - 60; v_flags := array_append(v_flags,'falso_parentesco');
    v_has_family_scam := TRUE;
  END IF;
  -- Phishing bancário
  IF v_text_lower ~ '(cart[ãa]o (clonado|bloqueado)|conta (bloqueada|suspensa)|verifica[çc][ãa]o de seguran[çc]a)' THEN
    v_score := v_score - 70; v_flags := array_append(v_flags,'phishing_bancario');
    v_has_phishing := TRUE;
  END IF;

  -- COMBOS CRÍTICOS (auto-quarantine)
  IF v_has_phishing AND v_text_lower ~ '(clique|click|bit\.ly|link|http)' THEN
    v_score := LEAST(v_score, 10);
    v_flags := array_append(v_flags,'combo_phishing_link');
  END IF;
  -- Pix urgente + parentesco = scam clássico "sou do filho, me manda pix"
  IF v_has_pix_scam AND v_has_family_scam THEN
    v_score := LEAST(v_score, 5);
    v_flags := array_append(v_flags,'combo_pix_familia_classico');
  END IF;

  -- Só link
  IF p_text ~* '^\s*https?://\S+\s*$' THEN
    v_score := v_score - 25; v_flags := array_append(v_flags,'so_link');
  END IF;
  -- Muito curta
  IF length(p_text) < 5 THEN v_score := v_score - 15; v_flags := array_append(v_flags,'muito_curta'); END IF;
  -- CAPS excessivo (>70% uppercase em msg longa)
  IF length(p_text) > 30 AND length(regexp_replace(p_text, '[^A-Z]', '', 'g'))::numeric / length(p_text) > 0.7 THEN
    v_score := v_score - 10; v_flags := array_append(v_flags,'caps_excessivo');
  END IF;
  -- Teste óbvio
  IF v_text_lower ~ '^(teste|test|testando|hello world|asdf|asdfg)\.?\s*$' THEN
    v_score := LEAST(v_score, 20); v_flags := array_append(v_flags,'mensagem_teste');
  END IF;
  -- Internacional sem contexto B2B
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
