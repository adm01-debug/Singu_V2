-- Garante que WEBHOOK_SECRET_ENFORCE esteja OFF durante a transição
-- (impede que a v5 atualmente em prod pare de funcionar quando deployarmos a v6)
UPDATE zapp_history.runtime_config SET value='false' WHERE key='WEBHOOK_SECRET_ENFORCE';

-- Cria função de ativação pós-deploy pra rodar quando você confirmar v6 em produção
CREATE OR REPLACE FUNCTION zapp_history.activate_v6_enforcement()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','pg_temp'
AS $fn$
BEGIN
  UPDATE zapp_history.runtime_config SET value='true' WHERE key='WEBHOOK_SECRET_ENFORCE';
  RETURN 'v6 enforcement ATIVADO em ' || NOW()::TEXT;
END;
$fn$;

-- Função de rollback rápido se algo der errado
CREATE OR REPLACE FUNCTION zapp_history.rollback_v6_enforcement()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','pg_temp'
AS $fn$
BEGIN
  UPDATE zapp_history.runtime_config SET value='false' WHERE key='WEBHOOK_SECRET_ENFORCE';
  RETURN 'v6 enforcement DESATIVADO (rollback) em ' || NOW()::TEXT;
END;
$fn$;
