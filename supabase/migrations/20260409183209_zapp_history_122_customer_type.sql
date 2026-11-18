-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409183209
-- nome:   zapp_history_122_customer_type

CREATE OR REPLACE FUNCTION zapp_history.classify_customer_type(p_text TEXT, p_has_cnpj BOOLEAN, p_qty INT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN 'indefinido'; END IF;
  v_text_lower := lower(p_text);

  -- REVENDEDOR: palavras-chave de revenda
  IF v_text_lower ~ '(revenda|revendedor|revender|distribuid(or|ora)|atacad(o|ista)|loja(s)? f[íi]sica|pra revender|para revender|comprar pra revender|tabela de pre[cç]o|wholesale)' THEN
    RETURN 'revendedor';
  END IF;

  -- B2B FORTE: empresa explícita + alto volume + CNPJ
  IF p_has_cnpj AND p_qty IS NOT NULL AND p_qty >= 100 THEN
    RETURN 'b2b';
  END IF;

  -- B2B: menção a corporativo, eventos, marketing, RH
  IF v_text_lower ~ '(empresa|corporativ[oa]|institucional|colaborador(es)?|funcion[áa]rios?|evento corporativo|evento da empresa|marketing|departamento de rh|brinde corporativo|kit boas vindas|endomarketing)' THEN
    RETURN 'b2b';
  END IF;

  -- B2B PROVÁVEL: tem CNPJ ou alta quantidade
  IF p_has_cnpj OR (p_qty IS NOT NULL AND p_qty >= 50) THEN
    RETURN 'b2b';
  END IF;

  -- B2C: palavras de consumidor final
  IF v_text_lower ~ '(meu casamento|aniversário|festa|chá de bebê|chá de cozinha|presente pra|presentinho|para mim|pessoal|individual|formatura|despedida)' THEN
    RETURN 'b2c';
  END IF;

  -- B2C provável: pedido pequeno sem CNPJ
  IF p_qty IS NOT NULL AND p_qty < 50 THEN
    RETURN 'b2c';
  END IF;

  RETURN 'indefinido';
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS customer_type TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_customer_type ON zapp_history.messages(customer_type) WHERE customer_type IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.classify_customer_type(TEXT, BOOLEAN, INT) TO authenticated, service_role;
