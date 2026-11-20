-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329204104
-- nome:   create_fn_supplier_cron_endpoint

-- Function que retorna tudo que o n8n precisa para disparar notificações
CREATE OR REPLACE FUNCTION fn_supplier_cron_endpoint()
RETURNS JSON AS $$
DECLARE
  v_daily_check JSON;
  v_dashboard JSON;
  v_queue_count INTEGER;
  v_data_quality JSON;
BEGIN
  -- Executar verificações diárias
  SELECT fn_supplier_daily_check() INTO v_daily_check;

  -- Dashboard resumido
  SELECT row_to_json(d) INTO v_dashboard FROM vw_supplier_qualification_dashboard d;

  -- Fila de homologação
  SELECT COUNT(*) INTO v_queue_count FROM vw_supplier_homologation_queue;

  -- Qualidade de dados resumida
  SELECT row_to_json(q) INTO v_data_quality FROM vw_supplier_data_quality q;

  RETURN json_build_object(
    'executed_at', NOW(),
    'daily_check', v_daily_check,
    'dashboard', v_dashboard,
    'homologation_queue_size', v_queue_count,
    'data_quality', v_data_quality
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_supplier_cron_endpoint IS 
'Endpoint único para n8n/cron. Executa daily_check + retorna dashboard + fila + qualidade de dados. Chamar 1x/dia.';
