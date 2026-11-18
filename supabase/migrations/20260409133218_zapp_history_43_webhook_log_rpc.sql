-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133218
-- nome:   zapp_history_43_webhook_log_rpc

-- ============================================================================
-- MELHORIA 43: RPC webhook_log_message — receba 1 chamada limpa do webhook
-- (futuramente, ou via curl/test) e popule connector_log + dispara trigger.
-- Ideal pra testar via dashboard sem mexer no JSON do INSERT.
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.webhook_log_message(
  p_direction TEXT,
  p_whatsapp_number TEXT,
  p_push_name TEXT DEFAULT NULL,
  p_message_text TEXT DEFAULT NULL,
  p_raw_payload JSONB DEFAULT NULL,
  p_bitrix_response JSONB DEFAULT NULL,
  p_evolution_response JSONB DEFAULT NULL
)
RETURNS TABLE (log_id BIGINT, processed BOOLEAN, message_id UUID, parse_error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, zapp_history, pg_temp
AS $fn$
DECLARE
  v_log_id BIGINT;
BEGIN
  IF p_direction NOT IN ('inbound','outbound','open-chat') THEN
    RAISE EXCEPTION 'invalid direction: %', p_direction;
  END IF;
  IF p_whatsapp_number IS NULL OR p_whatsapp_number = '' THEN
    RAISE EXCEPTION 'whatsapp_number required';
  END IF;

  INSERT INTO public.connector_log (
    direction, whatsapp_number, push_name, message_text,
    raw_payload, bitrix_response, evolution_response
  ) VALUES (
    p_direction, p_whatsapp_number, p_push_name, p_message_text,
    p_raw_payload, p_bitrix_response, p_evolution_response
  )
  RETURNING id INTO v_log_id;

  -- Retorna o estado pós-trigger
  RETURN QUERY
  SELECT cl.id, cl.processed, cl.zapp_message_id, cl.parse_error
  FROM public.connector_log cl
  WHERE cl.id = v_log_id;
END;
$fn$;

-- service_role e authenticated podem chamar
GRANT EXECUTE ON FUNCTION zapp_history.webhook_log_message(TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB) TO authenticated, service_role;

COMMENT ON FUNCTION zapp_history.webhook_log_message IS
  'RPC-friendly: insere em connector_log e dispara o pipeline. Útil pra testes via dashboard / Postman / curl.';
