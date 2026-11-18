-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409183603
-- nome:   zapp_history_128_b2c_priority_personal

CREATE OR REPLACE FUNCTION zapp_history.classify_customer_type(p_text TEXT, p_has_cnpj BOOLEAN, p_qty INT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN 'indefinido'; END IF;
  v_text_lower := lower(p_text);

  -- 1. REVENDEDOR (sempre prioridade máxima)
  IF v_text_lower ~ '(revenda|revendedor|revender|distribuid(or|ora)|atacad(o|ista)|loja(s)? f[íi]sica|pra revender|para revender|comprar pra revender|tabela de pre[cç]o atacado|wholesale)' THEN
    RETURN 'revendedor';
  END IF;

  -- 2. B2C explícito (eventos pessoais ANTES de qualquer regra B2B)
  IF v_text_lower ~ '(meu casamento|minha festa|meu anivers[áa]rio|noivado|ch[áa] de beb[êe]|ch[áa] de cozinha|ch[áa] revela[çc][ãa]o|formatura|despedida de solteir[ao]|presente pra (?:minha|meu)|presentinho|para mim|pessoal|individual|lembrancinha)' THEN
    RETURN 'b2c';
  END IF;

  -- 3. B2B FORTE: empresa explícita
  IF v_text_lower ~ '(empresa|corporativ[oa]|institucional|colaborador(es)?|funcion[áa]rios?|evento corporativo|evento da empresa|departamento|brinde corporativo|kit boas vindas|endomarketing|setor de rh|departamento de rh|nossa marca|nosso stand|nosso evento)' THEN
    RETURN 'b2b';
  END IF;

  -- 4. B2B: tem CNPJ + volume
  IF p_has_cnpj AND p_qty IS NOT NULL AND p_qty >= 100 THEN
    RETURN 'b2b';
  END IF;

  -- 5. B2B provável: só CNPJ
  IF p_has_cnpj THEN
    RETURN 'b2b';
  END IF;

  -- 6. B2B provável: volume alto sem CNPJ
  IF p_qty IS NOT NULL AND p_qty >= 200 THEN
    RETURN 'b2b';
  END IF;

  -- 7. B2C: volume baixo
  IF p_qty IS NOT NULL AND p_qty < 200 THEN
    RETURN 'b2c';
  END IF;

  RETURN 'indefinido';
END;
$fn$;

-- Backfill nas mensagens do teste
UPDATE zapp_history.messages
SET customer_type = zapp_history.classify_customer_type(
  content,
  nlp_structured_order ? 'cnpj',
  CASE WHEN nlp_structured_order->>'quantity' ~ '^\d+$'
    THEN (nlp_structured_order->>'quantity')::INT ELSE NULL END
)
WHERE whatsapp_message_id LIKE '\_v126\_%' ESCAPE '\';

SELECT whatsapp_message_id, customer_type, event_type, communication_tone->>'tone' AS tom
FROM zapp_history.messages
WHERE whatsapp_message_id LIKE '\_v126\_%' ESCAPE '\'
ORDER BY whatsapp_message_id;
