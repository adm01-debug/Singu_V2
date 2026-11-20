-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329182249
-- nome:   add_documentation_comments

-- Tabelas
COMMENT ON TABLE supplier_homologations IS 'Homologação de fornecedores pelo Depto de Compras. Cada registro = uma solicitação/decisão. Histórico completo mantido.';
COMMENT ON TABLE supplier_evaluations IS 'Avaliações de fornecedores por entrega ou período. Notas de 1-5 em 4 critérios. Trigger recalcula score automaticamente.';
COMMENT ON TABLE supplier_scores IS 'Score consolidado do fornecedor (0-100). Atualizado automaticamente a cada avaliação. 1 registro por fornecedor.';
COMMENT ON TABLE supplier_score_history IS 'Histórico de evolução do score. Cada recálculo gera 1 registro. Permite rastrear tendências ao longo do tempo.';
COMMENT ON TABLE supplier_qualification_config IS 'Configuração dos segmentos de classificação (Excelente/Bom/Regular/Insuficiente/Crítico) com faixas de score e cores.';

-- Colunas chave
COMMENT ON COLUMN suppliers.homologado IS 'Cache: true se última homologação está vigente. Atualizado por trigger.';
COMMENT ON COLUMN suppliers.score_geral IS 'Cache: score consolidado 0-100. Atualizado por trigger após avaliação.';
COMMENT ON COLUMN suppliers.data_homologacao IS 'Data da última homologação aprovada.';
COMMENT ON COLUMN supplier_evaluations.nota_geral IS 'Média simples das 4 notas. Campo GENERATED (calculado automaticamente).';
COMMENT ON COLUMN supplier_scores.trend IS 'Tendência: melhorando (subiu >2pts), estavel, piorando (caiu >2pts).';
COMMENT ON COLUMN supplier_scores.segment_code IS 'FK para supplier_qualification_config. Define classificação.';
COMMENT ON COLUMN supplier_homologations.criterios_checados IS 'JSONB com checklist: cnpj_valido, documentacao_fiscal, referencias_checadas, capacidade_produtiva, visita_tecnica, etc.';
COMMENT ON COLUMN supplier_homologations.validade IS 'Data de expiração. Preenchida automaticamente via config HOMOLOGACAO_VALIDADE_DIAS se não informada.';

-- Functions
COMMENT ON FUNCTION fn_recalcular_supplier_score IS 'Recalcula score de 1 fornecedor com base em TODAS as avaliações. Usa pesos de config_regras_negocio. Gera histórico.';
COMMENT ON FUNCTION fn_check_supplier_homologation_expiry IS 'Verifica homologações vencidas/vencendo e gera alertas. Chamar via cron diário.';
COMMENT ON FUNCTION fn_check_supplier_score_alerts IS 'Verifica scores baixos/destaque e gera alertas. Chamar via cron diário.';
COMMENT ON FUNCTION fn_supplier_daily_check IS 'Orquestrador diário: chama expiry + score alerts. Ideal para n8n/cron.';
COMMENT ON FUNCTION fn_supplier_bulk_recalc IS 'Recalcula TODOS os scores. Usar após alterar pesos.';
COMMENT ON FUNCTION fn_homologar_fornecedor IS 'API de homologação com validações (avaliador=Compras, motivo obrigatório em reprovação).';
COMMENT ON FUNCTION fn_avaliar_fornecedor IS 'API de avaliação com validações (notas 1-5, avaliador ativo). Score recalculado via trigger.';
COMMENT ON FUNCTION fn_supplier_stats IS 'Painel completo de 1 fornecedor: dados, homologação, score, avaliações, histórico.';
