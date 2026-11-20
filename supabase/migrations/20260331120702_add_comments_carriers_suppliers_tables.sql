-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260331120702
-- nome:   add_comments_carriers_suppliers_tables

COMMENT ON TABLE carriers IS 'Transportadoras vinculadas a companies (1:1 via company_id UNIQUE). 112 registros. Campos de qualificação: homologado, data_homologacao, score_geral (caches atualizados por triggers). Homologação: Logística (Thiago id=80). 5 critérios: pontualidade(30%), conservação(25%), preço_frete(20%), cobertura(15%), rastreamento(10%).';

COMMENT ON TABLE suppliers IS 'Fornecedores vinculados a companies (1:1 via company_id UNIQUE). Campos de qualificação: homologado, data_homologacao, score_geral (caches atualizados por triggers). Homologação: Compras (Thaina id=30, Elen id=31, Stephanie id=32). 4 critérios: preço(25%), prazo(25%), qualidade(30%), entrega(20%).';
