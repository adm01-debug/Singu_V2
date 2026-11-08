CREATE OR REPLACE FUNCTION zapp_history.detect_topics(p_text text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_topics TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN v_topics; END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(pre[çc]o|valor|quanto custa|or[çc]amento|cota[çc][ãa]o)' THEN v_topics := array_append(v_topics, 'preco'); END IF;
  IF v_text_lower ~ '(prazo|entrega|quando chega|quando fica pronto|data)' THEN v_topics := array_append(v_topics, 'prazo'); END IF;
  IF v_text_lower ~ '(qualidade|durabilidade|material|acabamento|resist[êe]ncia)' THEN v_topics := array_append(v_topics, 'qualidade'); END IF;
  IF v_text_lower ~ '(personaliza|logo|arte|impress[ãa]o|grava[çc][ãa]o|silk|tampografia|sublima[çc][ãa]o)' THEN v_topics := array_append(v_topics, 'personalizacao'); END IF;
  IF v_text_lower ~ '(amostra|prot[óo]tipo|teste|prova|aprova[çc][ãa]o de arte)' THEN v_topics := array_append(v_topics, 'amostra'); END IF;
  IF v_text_lower ~ '(pagamento|boleto|pix|cart[ãa]o|parcel|entrada|sinal)' THEN v_topics := array_append(v_topics, 'pagamento'); END IF;
  IF v_text_lower ~ '(frete|envio|transportadora|correios|sedex)' THEN v_topics := array_append(v_topics, 'frete'); END IF;
  IF v_text_lower ~ '(garantia|assistência|defeito|reclama[çc][ãa]o)' THEN v_topics := array_append(v_topics, 'garantia'); END IF;
  IF v_text_lower ~ '(estoque|dispon[íi]vel|tem pronta entrega)' THEN v_topics := array_append(v_topics, 'estoque'); END IF;
  IF v_text_lower ~ '(quantidade m[íi]nima|m[íi]nimo de pedido|menor quantidade)' THEN v_topics := array_append(v_topics, 'quantidade_minima'); END IF;
  IF v_text_lower ~ '(catalogo|cat[áa]logo|portf[óo]lio|modelos|op[çc][õo]es)' THEN v_topics := array_append(v_topics, 'catalogo'); END IF;
  IF v_text_lower ~ '(nota fiscal|nf-?e|cnpj|cpf|raz[ãa]o social)' THEN v_topics := array_append(v_topics, 'fiscal'); END IF;

  RETURN v_topics;
END;
$function$
