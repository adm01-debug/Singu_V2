-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205209
-- nome:   zapp_history_141_disc_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_disc_profile(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_d INT := 0; v_i INT := 0; v_s INT := 0; v_c INT := 0;
  v_dominant TEXT;
BEGIN
  IF p_text IS NULL OR length(p_text) < 5 THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- D (Dominante): direto, decidido, foco em resultado, urgência
  IF v_text_lower ~ '(quero|preciso|urgente|agora|r[áa]pido|direto ao ponto|resultado|fechar|definir|decidir|j[áa])' THEN v_d := v_d + 2; END IF;
  IF v_text_lower ~ '(manda|envia|me passa|me d[áa]|me responde|me retorna)' THEN v_d := v_d + 2; END IF;
  IF v_text_lower ~ '(sem enrola[çc][ãa]o|sem firula|objetiv[ao]|pragm[áa]tico)' THEN v_d := v_d + 3; END IF;

  -- I (Influente): emocional, social, entusiasmado, conectivo
  IF v_text_lower ~ '(adorei|amei|incr[íi]vel|maravilhos[oa]|sensacional|top|massa|legal demais)' THEN v_i := v_i + 3; END IF;
  IF v_text_lower ~ '(time|equipe|todo mundo|galera|pessoal|vamos juntos|parceria)' THEN v_i := v_i + 2; END IF;
  IF v_text_lower ~ '(festa|comemora|celebra|evento|reuni[ãa]o|encontro)' THEN v_i := v_i + 2; END IF;

  -- S (Estável): cordial, paciente, busca segurança, relacional
  IF v_text_lower ~ '(por favor|por gentileza|se poss[íi]vel|quando puder|sem pressa|com calma)' THEN v_s := v_s + 3; END IF;
  IF v_text_lower ~ '(obrigad[oa]|agradecid[oa]|grato|grata|abra[çc]o|aten[çc]ã[oa]samente)' THEN v_s := v_s + 2; END IF;
  IF v_text_lower ~ '(j[áa] (sou|fui) cliente|h[áa] anos|sempre comprei|tradi[çc][ãa]o|costume)' THEN v_s := v_s + 2; END IF;

  -- C (Consciente): analítico, detalhista, busca dados/especificações
  IF v_text_lower ~ '(especifica[çc][ãa]o|ficha t[ée]cnica|manual|certificado|garantia|qualidade|material|gramatura)' THEN v_c := v_c + 3; END IF;
  IF v_text_lower ~ '(comparativo|tabela|planilha|detalhes|exato|precis[ãa]o|m[íi]nimo|m[áa]ximo)' THEN v_c := v_c + 3; END IF;
  IF v_text_lower ~ '(prezad[oa]|atenciosamente|cordialmente|venho por meio)' THEN v_c := v_c + 2; END IF;

  v_dominant := CASE GREATEST(v_d, v_i, v_s, v_c)
    WHEN v_d THEN 'D'
    WHEN v_i THEN 'I'
    WHEN v_s THEN 'S'
    WHEN v_c THEN 'C'
  END;

  IF v_d = 0 AND v_i = 0 AND v_s = 0 AND v_c = 0 THEN
    RETURN jsonb_build_object('dominant', null, 'd', 0, 'i', 0, 's', 0, 'c', 0);
  END IF;

  RETURN jsonb_build_object(
    'dominant', v_dominant,
    'd', v_d, 'i', v_i, 's', v_s, 'c', v_c,
    'recommended_approach', CASE v_dominant
      WHEN 'D' THEN 'Direto e objetivo. Foco em resultado, ROI, prazo. Sem enrolação.'
      WHEN 'I' THEN 'Caloroso e entusiasmado. Use storytelling, mostre cases, fale de pessoas.'
      WHEN 'S' THEN 'Paciente e cordial. Construa relação, dê garantias, evite pressão.'
      WHEN 'C' THEN 'Técnico e detalhado. Mande ficha, especificações, certificados, comparativos.'
    END
  );
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS disc_profile JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_disc ON zapp_history.messages((disc_profile->>'dominant'))
  WHERE disc_profile IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_disc_profile(TEXT) TO authenticated, service_role;
