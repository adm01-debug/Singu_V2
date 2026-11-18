-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409224605
-- nome:   zapp_history_207_fix_competitor

CREATE OR REPLACE FUNCTION zapp_history.detect_competitor_mention(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_flags TEXT[] := ARRAY[]::TEXT[];
  v_context TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('mentioned',false); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(outra empresa|outro fornecedor|outra marca|concorrente|comparando (com|v[áa]rias|op[çc][õo]es)|outra op[çc][ãa]o|pesquisando fornecedores|pesquisando (v[áa]rias|op[çc][õo]es)|v[áa]rias op[çc][õo]es do mercado)' THEN
    v_flags := array_append(v_flags,'menciona_concorrente');
  END IF;
  IF v_text_lower ~ '(peguei com|comprei com|fiz com a empresa|or[çc]amento de outra|cota[cç][ãa]o em outra|j[áa] comprei com)' THEN
    v_flags := array_append(v_flags,'historico_concorrente');
  END IF;
  -- Plural e singular para "mais barato"
  IF v_text_lower ~ '(mais barato[s]? (em|no|na|com|l[áa])|eles est[ãa]o mais barato[s]?|cobrir esse valor|mais em conta|pre[çc]o menor em)' THEN
    v_flags := array_append(v_flags,'concorrente_mais_barato');
  END IF;
  IF v_text_lower ~ '(o outro fornecedor (faz|tem|entrega)|eles (fazem|t[êe]m|entregam)|l[áa] fazem|quais (os )?diferenciais|diferencia[il]s de voc[êe]s)' THEN
    v_flags := array_append(v_flags,'concorrente_diferencial');
  END IF;

  IF array_length(v_flags,1) IS NULL THEN RETURN jsonb_build_object('mentioned',false); END IF;

  v_context := CASE
    WHEN 'concorrente_mais_barato' = ANY(v_flags) THEN 'pressao_preco'
    WHEN 'concorrente_diferencial' = ANY(v_flags) THEN 'questiona_diferencial'
    WHEN 'historico_concorrente' = ANY(v_flags) THEN 'tem_fornecedor_atual'
    ELSE 'pesquisando'
  END;

  RETURN jsonb_build_object('mentioned', true, 'context', v_context, 'flags', to_jsonb(v_flags));
END;
$fn$;

-- Backfill nos testes v206
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, content FROM zapp_history.messages WHERE whatsapp_message_id LIKE '\_v206\_%' ESCAPE '\'
  LOOP
    UPDATE zapp_history.messages
    SET competitor_mention = CASE
      WHEN (zapp_history.detect_competitor_mention(r.content)->>'mentioned')::boolean
      THEN zapp_history.detect_competitor_mention(r.content)
      ELSE NULL
    END
    WHERE id = r.id;
  END LOOP;
END $$;

SELECT whatsapp_message_id, competitor_mention->>'context' AS contexto, competitor_mention->'flags' AS flags
FROM zapp_history.messages
WHERE whatsapp_message_id LIKE '\_v206\_%' ESCAPE '\'
ORDER BY whatsapp_message_id;
