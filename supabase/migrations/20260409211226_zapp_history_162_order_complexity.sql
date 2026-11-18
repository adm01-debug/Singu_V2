-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409211226
-- nome:   zapp_history_162_order_complexity

CREATE OR REPLACE FUNCTION zapp_history.detect_order_complexity(p_text TEXT, p_qty INT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_complexity_score INT := 0;
  v_complexity TEXT;
  v_factors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('level','indefinido','score',0); END IF;
  v_text_lower := lower(p_text);

  -- Volume alto = complexo
  IF p_qty >= 5000 THEN v_complexity_score := v_complexity_score + 30; v_factors := array_append(v_factors,'volume_muito_alto');
  ELSIF p_qty >= 1000 THEN v_complexity_score := v_complexity_score + 15; v_factors := array_append(v_factors,'volume_alto');
  ELSIF p_qty >= 200 THEN v_complexity_score := v_complexity_score + 5; v_factors := array_append(v_factors,'volume_medio');
  END IF;

  -- Múltiplos produtos
  IF v_text_lower ~ '(e\s+(tamb[ée]m|mais|al[ée]m|outros)|tipos diferentes|variados|mais de um modelo|combo|kit completo)' THEN
    v_complexity_score := v_complexity_score + 15;
    v_factors := array_append(v_factors,'multi_produto');
  END IF;

  -- Personalização complexa (cores, tamanhos, modelos)
  IF v_text_lower ~ '(v[áa]rias cores|cores diferentes|tamanhos variados|com nomes diferentes|individualizado|personalizado um a um|nomes individuais)' THEN
    v_complexity_score := v_complexity_score + 20;
    v_factors := array_append(v_factors,'personalizacao_individual');
  END IF;

  -- Embalagem especial
  IF v_text_lower ~ '(embalagem (especial|personalizada|individual)|kit (presente|montado)|sacolinha personalizada|caixa personalizada)' THEN
    v_complexity_score := v_complexity_score + 15;
    v_factors := array_append(v_factors,'embalagem_especial');
  END IF;

  -- Logística complexa
  IF v_text_lower ~ '(entregar em (v[áa]rios|m[úu]ltiplos|diversos) (locais|endere[çc]os|cidades|estados)|distribui[çc][ãa]o nacional|filiais)' THEN
    v_complexity_score := v_complexity_score + 25;
    v_factors := array_append(v_factors,'logistica_multi_destino');
  END IF;

  -- Aprovação técnica/arte
  IF v_text_lower ~ '(aprova[çc][ãa]o de arte|prova digital|prot[óo]tipo|amostra antes|teste de impress[ãa]o)' THEN
    v_complexity_score := v_complexity_score + 10;
    v_factors := array_append(v_factors,'aprovacao_tecnica');
  END IF;

  -- Certificações exigidas
  IF v_text_lower ~ '(certifica[çc][ãa]o|laudo|nota t[ée]cnica|abnt|inmetro|anatel|conformidade)' THEN
    v_complexity_score := v_complexity_score + 15;
    v_factors := array_append(v_factors,'requisito_certificacao');
  END IF;

  v_complexity := CASE
    WHEN v_complexity_score >= 50 THEN 'complexo'
    WHEN v_complexity_score >= 20 THEN 'medio'
    WHEN v_complexity_score > 0 THEN 'simples'
    ELSE 'indefinido'
  END;

  RETURN jsonb_build_object('level',v_complexity,'score',v_complexity_score,'factors',to_jsonb(v_factors));
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS order_complexity JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_complexity ON zapp_history.messages((order_complexity->>'level'))
  WHERE order_complexity IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_order_complexity(TEXT, INT) TO authenticated, service_role;
