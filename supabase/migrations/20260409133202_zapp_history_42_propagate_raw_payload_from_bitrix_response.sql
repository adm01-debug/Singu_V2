-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133202
-- nome:   zapp_history_42_propagate_raw_payload_from_bitrix_response

-- ============================================================================
-- MELHORIA 42: Aproveita bitrix_response/evolution_response que JÁ vêm
-- preenchidos pelo webhook v5 para enriquecer raw_payload do trigger.
-- Quando o webhook não passar raw_payload, tenta extrair info dos response
-- payloads que ele já guarda.
-- ============================================================================

-- Adiciona coluna helper que contém raw_payload OU bitrix_response como fallback
ALTER TABLE public.connector_log
  ADD COLUMN IF NOT EXISTS effective_payload JSONB GENERATED ALWAYS AS (
    COALESCE(raw_payload, bitrix_response, evolution_response, '{}'::jsonb)
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_cl_effective_payload
  ON public.connector_log USING GIN (effective_payload);

-- Helper: extrai mensagem do payload do connector_log para fins de busca
CREATE OR REPLACE FUNCTION zapp_history.connector_log_search(p_query TEXT)
RETURNS TABLE (
  log_id BIGINT,
  direction TEXT,
  whatsapp_number TEXT,
  push_name TEXT,
  message_text TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    cl.id, cl.direction, cl.whatsapp_number, cl.push_name, cl.message_text, cl.created_at,
    ts_rank(to_tsvector('portuguese', coalesce(cl.message_text,'')), plainto_tsquery('portuguese', p_query)) AS rank
  FROM public.connector_log cl
  WHERE to_tsvector('portuguese', coalesce(cl.message_text,'')) @@ plainto_tsquery('portuguese', p_query)
  ORDER BY rank DESC, cl.created_at DESC
  LIMIT 50;
END;
$fn$;

-- FTS index para busca rápida
CREATE INDEX IF NOT EXISTS idx_cl_message_text_fts
  ON public.connector_log USING GIN (to_tsvector('portuguese', coalesce(message_text, '')));

GRANT EXECUTE ON FUNCTION zapp_history.connector_log_search(TEXT) TO authenticated;

COMMENT ON COLUMN public.connector_log.effective_payload IS
  'GENERATED column: usa raw_payload se presente, senão fallback para bitrix_response/evolution_response.';
