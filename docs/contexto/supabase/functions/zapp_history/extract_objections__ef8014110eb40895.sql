CREATE OR REPLACE FUNCTION zapp_history.extract_objections(p_text text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_objections TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN v_objections; END IF;
  v_text_lower := lower(p_text);

  -- Preço
  IF v_text_lower ~ '(caro|car[íi]ssimo|abusivo|fora do or[çc]amento|n[ãa]o cabe no bolso|sem condi[çc][õo]es|muito alto)' THEN
    v_objections := array_append(v_objections, 'preco_alto');
  END IF;

  -- Concorrente
  IF v_text_lower ~ '(concorrente|outro fornecedor|outra empresa|cota[çc][ãa]o melhor|melhor pre[çc]o|encontrei mais barato)' THEN
    v_objections := array_append(v_objections, 'concorrencia');
  END IF;

  -- Prazo
  IF v_text_lower ~ '(prazo (longo|grande|muito|alto)|demora demais|n[ãa]o d[áa] tempo|muito tempo)' THEN
    v_objections := array_append(v_objections, 'prazo_longo');
  END IF;

  -- Qualidade
  IF v_text_lower ~ '(qualidade ruim|m[áa] qualidade|estraga r[áa]pido|fraco|amassa f[áa]cil)' THEN
    v_objections := array_append(v_objections, 'qualidade');
  END IF;

  -- Indecisão
  IF v_text_lower ~ '(vou pensar|preciso pensar|deixa eu pensar|n[ãa]o sei ainda|talvez|depois eu vejo|qualquer coisa volto|aviso depois)' THEN
    v_objections := array_append(v_objections, 'indecisao');
  END IF;

  -- Aprovação interna
  IF v_text_lower ~ '(preciso (falar|consultar|aprovar) com|chefe|gestor|diretor|s[óo]cio|aprovar internamente|aprova[çc][ãa]o)' THEN
    v_objections := array_append(v_objections, 'aprovacao_interna');
  END IF;

  -- Forma de pagamento
  IF v_text_lower ~ '(parcel(a|amento)|boleto|cart[ãa]o|pix|condi[çc][ãa]o de pagamento|pagamento|sem dinheiro)' THEN
    v_objections := array_append(v_objections, 'forma_pagamento');
  END IF;

  -- Dúvida técnica
  IF v_text_lower ~ '(d[úu]vida|n[ãa]o entendi|como funciona|me explica|me ajuda a entender)' THEN
    v_objections := array_append(v_objections, 'duvida_tecnica');
  END IF;

  RETURN v_objections;
END;
$function$
