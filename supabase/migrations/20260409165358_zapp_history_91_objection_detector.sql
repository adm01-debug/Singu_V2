-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409165358
-- nome:   zapp_history_91_objection_detector

CREATE OR REPLACE FUNCTION zapp_history.extract_objections(p_text TEXT)
RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE AS $fn$
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
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS objections TEXT[];

CREATE INDEX IF NOT EXISTS idx_messages_objections
  ON zapp_history.messages USING GIN (objections)
  WHERE objections IS NOT NULL AND array_length(objections, 1) > 0;

GRANT EXECUTE ON FUNCTION zapp_history.extract_objections(TEXT) TO authenticated, service_role;
