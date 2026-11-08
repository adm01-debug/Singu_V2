CREATE OR REPLACE FUNCTION zapp_history.detect_competitor_mention(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
