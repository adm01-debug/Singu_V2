-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234018
-- nome:   zapp_audit_m01_webhook_secret_infra

-- Gera um webhook_shared_secret aleatório de 48 chars e grava no runtime_config
INSERT INTO zapp_history.runtime_config (key, value, is_secret, description)
VALUES (
  'WEBHOOK_SHARED_SECRET',
  encode(gen_random_bytes(32), 'hex'),
  true,
  'Secret compartilhado entre edge function e Evolution API. Deve ser enviado no header x-webhook-secret'
)
ON CONFLICT (key) DO NOTHING;

-- Também registra as outras configs (placeholders que Joaquim substituirá via dashboard ou eu atualizo)
INSERT INTO zapp_history.runtime_config (key, value, is_secret, description) VALUES
('EVOLUTION_URL','https://evolution.atomicabr.com.br',false,'URL da Evolution API'),
('EVOLUTION_INSTANCE','wpp2',false,'Instância Evolution ativa'),
('BITRIX_PORTAL','https://promobrindes.bitrix24.com.br',false,'Portal Bitrix24'),
('BITRIX_CONNECTOR_ID','evolution_whatsapp',false,'ID do conector imconnector'),
('BITRIX_LINE_ID','44',false,'Line ID do Open Channel Bitrix24')
ON CONFLICT (key) DO NOTHING;

-- Função pra ler secret (só service_role)
CREATE OR REPLACE FUNCTION zapp_history.get_runtime_secret(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','pg_temp'
AS $fn$
DECLARE v_value TEXT;
BEGIN
  SELECT value INTO v_value FROM zapp_history.runtime_config WHERE key = p_key;
  RETURN v_value;
END;
$fn$;

-- Permite service_role chamar
REVOKE ALL ON FUNCTION zapp_history.get_runtime_secret(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION zapp_history.get_runtime_secret(TEXT) TO service_role;
