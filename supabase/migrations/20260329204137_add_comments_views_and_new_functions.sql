-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329204137
-- nome:   add_comments_views_and_new_functions

COMMENT ON VIEW vw_suppliers IS 'View compacta de fornecedores: dados básicos + homologação + score + contato.';
COMMENT ON VIEW vw_suppliers_completo IS 'View detalhada: todos os campos de suppliers + companies + score detalhado + homologação + contato.';
COMMENT ON VIEW vw_supplier_qualification_dashboard IS 'Dashboard consolidado: totais, segmentos, tendências, homologações, avaliações. Consulta única para painel gerencial.';
COMMENT ON VIEW vw_supplier_ranking IS 'Ranking de fornecedores por score_geral DESC. Inclui cor do segmento.';
COMMENT ON VIEW vw_supplier_homologation_control IS 'Controle de homologação: status, dias para vencer, situação calculada, avaliador. Ordenado por prioridade de ação.';
COMMENT ON VIEW vw_supplier_evaluations_history IS 'Histórico de avaliações: notas, referência, avaliador, departamento. Ordenado por data DESC.';
COMMENT ON VIEW vw_supplier_alerts IS 'Alertas ativos de fornecedores. Filtro automático por type LIKE supplier_%. Ordenado por prioridade.';
COMMENT ON VIEW vw_supplier_homologation_queue IS 'Fila de trabalho para Compras: fornecedores que precisam ser homologados, com indicação de dados disponíveis e prioridade.';
COMMENT ON VIEW vw_supplier_data_quality IS 'Radiografia de qualidade de dados dos fornecedores: % com CNPJ, telefone, email, endereço, cadastro completo.';
COMMENT ON FUNCTION fn_suspend_supplier IS 'Suspende fornecedor com motivo obrigatório. Apenas Compras. Gera alerta critical automaticamente.';
COMMENT ON FUNCTION fn_supplier_cron_endpoint IS 'Endpoint único para n8n/cron diário. Executa daily_check + retorna dashboard, fila e qualidade de dados em JSON.';
