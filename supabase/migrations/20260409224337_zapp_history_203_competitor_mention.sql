-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409224337
-- nome:   zapp_history_203_competitor_mention

CREATE OR REPLACE FUNCTION zapp_history.detect_competitor_mention(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_flags TEXT[] := ARRAY[]::TEXT[];
  v_context TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('mentioned',false); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(outra empresa|outro fornecedor|outra marca|concorrente|comparando com|outra op[çc][ãa]o)' THEN
    v_flags := array_append(v_flags,'menciona_concorrente');
  END IF;
  IF v_text_lower ~ '(peguei com|comprei com|fiz com a empresa|orçamento de outra|cota[cç][ãa]o em outra)' THEN
    v_flags := array_append(v_flags,'historico_concorrente');
  END IF;
  IF v_text_lower ~ '(mais barato em outro|mais barato la|mais barato com)' THEN
    v_flags := array_append(v_flags,'concorrente_mais_barato');
  END IF;
  IF v_text_lower ~ '(o outro fornecedor (faz|tem|entrega)|eles (fazem|t[êe]m)|l[áa] fazem)' THEN
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

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS competitor_mention JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_competitor ON zapp_history.messages((competitor_mention->>'context'))
  WHERE competitor_mention IS NOT NULL;
GRANT EXECUTE ON FUNCTION zapp_history.detect_competitor_mention(TEXT) TO authenticated, service_role;
