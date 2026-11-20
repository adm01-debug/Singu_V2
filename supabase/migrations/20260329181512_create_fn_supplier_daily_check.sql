-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181512
-- nome:   create_fn_supplier_daily_check

CREATE OR REPLACE FUNCTION fn_supplier_daily_check()
RETURNS JSON AS $$
DECLARE
  v_result_homologacao JSON;
  v_result_scores JSON;
BEGIN
  -- 1. Verificar homologações vencidas e vencendo
  SELECT fn_check_supplier_homologation_expiry() INTO v_result_homologacao;

  -- 2. Verificar scores e gerar alertas
  SELECT fn_check_supplier_score_alerts() INTO v_result_scores;

  RETURN json_build_object(
    'executed_at', NOW(),
    'homologacao', v_result_homologacao,
    'scores', v_result_scores
  );
END;
$$ LANGUAGE plpgsql;

-- Comentário para documentação
COMMENT ON FUNCTION fn_supplier_daily_check() IS 
'Verificação diária de fornecedores. Chamar via cron/n8n 1x por dia.
Verifica: homologações vencidas/vencendo + scores baixos/destaque.
Gera alertas automaticamente na tabela alerts.';
