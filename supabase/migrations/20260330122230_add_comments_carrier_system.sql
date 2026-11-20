-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330122230
-- nome:   add_comments_carrier_system

-- Tabelas
COMMENT ON TABLE carrier_homologations IS 'Histórico de homologação de transportadoras. Homologador: Logística (Thiago id=80). Status via enum carrier_homologation_status.';
COMMENT ON TABLE carrier_evaluations IS 'Avaliações de transportadoras (append-only). 5 critérios: pontualidade, conservação, preço_frete, rastreamento, cobertura. Notas 1-5.';
COMMENT ON TABLE carrier_scores IS 'Score consolidado de transportadoras (1 registro por carrier). Recalculado via trigger após cada avaliação.';
COMMENT ON TABLE carrier_score_history IS 'Histórico de evolução do score de transportadoras. Append-only, 1 registro por recálculo.';

-- Colunas-chave carrier_evaluations
COMMENT ON COLUMN carrier_evaluations.nota_pontualidade IS 'Entrega no prazo prometido. 1=sempre atrasa, 5=sempre pontual. Peso: 30%';
COMMENT ON COLUMN carrier_evaluations.nota_conservacao IS 'Mercadoria sem avarias/danos. 1=sempre danifica, 5=perfeito. Peso: 25%';
COMMENT ON COLUMN carrier_evaluations.nota_preco_frete IS 'Competitividade do preço. 1=muito caro, 5=melhor custo-benefício. Peso: 20%';
COMMENT ON COLUMN carrier_evaluations.nota_cobertura IS 'Abrangência geográfica. 1=muito restrita, 5=cobertura nacional. Peso: 15%';
COMMENT ON COLUMN carrier_evaluations.nota_rastreamento IS 'Qualidade do rastreamento. 1=sem rastreio, 5=tempo real completo. Peso: 10%';
