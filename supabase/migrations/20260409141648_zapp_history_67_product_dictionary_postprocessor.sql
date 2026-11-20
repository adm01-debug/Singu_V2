-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409141648
-- nome:   zapp_history_67_product_dictionary_postprocessor

-- Tabela de dicionário de produtos do segmento brindes
CREATE TABLE IF NOT EXISTS zapp_history.product_dictionary (
  id SERIAL PRIMARY KEY,
  canonical_name TEXT UNIQUE NOT NULL,
  patterns TEXT[] NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO zapp_history.product_dictionary (canonical_name, patterns, category) VALUES
  ('caneca','{caneca,canecas,caneca personalizada,canecas personalizadas,xícara,xicara}','drinkware'),
  ('caneta','{caneta,canetas,caneta personalizada,canetas personalizadas,esferográfica,esferografica}','escritorio'),
  ('caderno','{caderno,cadernos,bloco,blocos,bloco de notas,blocos de notas}','escritorio'),
  ('squeeze','{squeeze,squeezes,garrafa,garrafas,garrafinha,garrafinhas}','drinkware'),
  ('mochila','{mochila,mochilas,mochila executiva,mochilas executivas,mochila de notebook}','bags'),
  ('chaveiro','{chaveiro,chaveiros,porta-chaves}','acessorios'),
  ('camiseta','{camiseta,camisetas,camisa,camisas,camisa polo,polo,polos,t-shirt,tshirt,blusa,blusas}','vestuario'),
  ('boné','{bone,bones,boné,bonés,touca,toucas}','vestuario'),
  ('bolsa','{bolsa,bolsas,sacola,sacolas,ecobag,ecobags,sacola ecológica,sacola ecologica}','bags'),
  ('capa de chuva','{capa de chuva,capas de chuva,capa,capas,jaqueta,jaquetas,impermeável,impermeavel}','vestuario'),
  ('agenda','{agenda,agendas,planner,planners}','escritorio'),
  ('mousepad','{mousepad,mousepads,mouse pad,mouse pads,base de mouse}','informatica'),
  ('pen drive','{pen drive,pendrive,pendrives,pen drives,pendrive personalizado}','informatica'),
  ('crachá','{cracha,cracha,crachas,crachás,porta-crachá,porta-cracha}','acessorios'),
  ('lapiseira','{lapiseira,lapiseiras,lápis,lapis,lápis personalizado}','escritorio'),
  ('sacola','{sacola,sacolas,sacola promocional,sacolas promocionais}','bags'),
  ('squeeze esportivo','{squeeze esportivo,squeezes esportivos,garrafa esportiva,garrafas esportivas}','drinkware'),
  ('máscara','{mascara,mascaras,máscara,máscaras,proteção facial}','epi'),
  ('toalha','{toalha,toalhas,toalha personalizada}','tecido'),
  ('guarda-chuva','{guarda-chuva,guarda chuva,guardachuva,guarda-chuvas}','acessorios')
ON CONFLICT (canonical_name) DO NOTHING;

-- Função: extrai produto do texto usando o dicionário
CREATE OR REPLACE FUNCTION zapp_history.extract_product_from_text(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  r RECORD;
  v_text_lower TEXT;
  v_pattern TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  FOR r IN SELECT canonical_name, patterns FROM zapp_history.product_dictionary
  LOOP
    FOREACH v_pattern IN ARRAY r.patterns
    LOOP
      IF v_text_lower ~ ('\m' || lower(v_pattern) || '\M') THEN
        RETURN r.canonical_name;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NULL;
END;
$fn$;

-- Atualiza reconcile pra rodar o pós-processador
CREATE OR REPLACE FUNCTION zapp_history.reconcile_nlp_responses()
RETURNS TABLE (reconciled_count INTEGER, errors_count INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  r RECORD;
  v_response RECORD;
  v_body JSONB;
  v_count INTEGER := 0;
  v_errors INTEGER := 0;
  v_struct_order JSONB;
  v_extracted_product TEXT;
BEGIN
  FOR r IN
    SELECT id, nlp_request_id, content
    FROM zapp_history.messages
    WHERE nlp_request_id IS NOT NULL AND nlp_processed_at IS NULL
    ORDER BY created_at ASC LIMIT 500
  LOOP
    BEGIN
      SELECT status_code, content::text AS content_text INTO v_response
      FROM net._http_response WHERE id = r.nlp_request_id;

      IF v_response IS NULL THEN CONTINUE; END IF;

      IF v_response.status_code = 200 THEN
        v_body := v_response.content_text::jsonb;
        v_struct_order := COALESCE(v_body->'ner'->'structured_order', '{}'::jsonb);

        -- Pós-processador: se NLP não detectou product, tenta dicionário
        IF NOT (v_struct_order ? 'product') THEN
          v_extracted_product := zapp_history.extract_product_from_text(r.content);
          IF v_extracted_product IS NOT NULL THEN
            v_struct_order := v_struct_order || jsonb_build_object('product', v_extracted_product);
          END IF;
        END IF;

        UPDATE zapp_history.messages
        SET
          nlp_entities = v_body->'ner'->'entities',
          nlp_structured_order = v_struct_order,
          nlp_sentiment = v_body->'sentiment'->>'label',
          nlp_sentiment_score = (v_body->'sentiment'->>'score')::numeric,
          nlp_processed_at = NOW()
        WHERE id = r.id;
        v_count := v_count + 1;
      ELSE
        UPDATE zapp_history.messages
        SET nlp_processed_at = NOW(),
            nlp_entities = jsonb_build_object('error', v_response.content_text, 'status', v_response.status_code)
        WHERE id = r.id;
        v_errors := v_errors + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_count, v_errors;
END;
$fn$;

-- Backfill: re-processa as 2 mensagens onde NLP não pegou produto
UPDATE zapp_history.messages m
SET
  nlp_structured_order = m.nlp_structured_order || jsonb_build_object(
    'product', zapp_history.extract_product_from_text(m.content)
  )
WHERE m.whatsapp_message_id IN ('_v66_001','_v66_005')
  AND zapp_history.extract_product_from_text(m.content) IS NOT NULL;
