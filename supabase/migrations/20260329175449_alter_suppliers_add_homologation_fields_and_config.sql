-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329175449
-- nome:   alter_suppliers_add_homologation_fields_and_config

-- Novos campos em suppliers
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS homologado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_homologacao DATE,
  ADD COLUMN IF NOT EXISTS score_geral NUMERIC(5,2);

-- Index para consulta rápida de homologação
CREATE INDEX idx_suppliers_homologado ON suppliers(homologado);
CREATE INDEX idx_suppliers_score_geral ON suppliers(score_geral DESC NULLS LAST);

-- Pesos do score em config_regras_negocio
INSERT INTO config_regras_negocio (chave, valor, descricao) VALUES
  ('PESO_SCORE_PRECO',      '25', 'Peso do critério Preço no score de fornecedor (%)'),
  ('PESO_SCORE_PRAZO',      '25', 'Peso do critério Prazo no score de fornecedor (%)'),
  ('PESO_SCORE_QUALIDADE',  '30', 'Peso do critério Qualidade no score de fornecedor (%)'),
  ('PESO_SCORE_ENTREGA',    '20', 'Peso do critério Entrega no score de fornecedor (%)'),
  ('HOMOLOGACAO_VALIDADE_DIAS', '365', 'Dias de validade da homologação de fornecedor'),
  ('SUPPLIER_SCORE_ALERTA_BAIXO', '40', 'Score abaixo deste valor gera alerta negativo'),
  ('SUPPLIER_SCORE_DESTAQUE', '85', 'Score acima deste valor gera alerta positivo');

-- Regras de alerta para fornecedores no alert_rules
INSERT INTO alert_rules (id, rule_name, rule_code, description, applies_to, trigger_entity, trigger_condition, action_type, action_config, check_frequency, cooldown_hours, is_active) VALUES
  (gen_random_uuid(), 'Score Fornecedor Baixo', 'supplier_score_baixo', 
   'Alerta quando score do fornecedor cai abaixo do limiar configurado',
   'all_users', 'supplier',
   '{"field":"score_geral","operator":"<","value_ref":"SUPPLIER_SCORE_ALERTA_BAIXO"}'::jsonb,
   'notification',
   '{"priority":"high","template":"supplier_score_baixo"}'::jsonb,
   'daily', 24, true),

  (gen_random_uuid(), 'Fornecedor Destaque', 'supplier_destaque',
   'Alerta positivo quando fornecedor mantém score alto',
   'all_users', 'supplier',
   '{"field":"score_geral","operator":">","value_ref":"SUPPLIER_SCORE_DESTAQUE"}'::jsonb,
   'notification',
   '{"priority":"normal","template":"supplier_destaque"}'::jsonb,
   'weekly', 168, true),

  (gen_random_uuid(), 'Homologação Vencendo', 'supplier_homologacao_vencendo',
   'Alerta quando homologação está próxima de vencer (30 dias)',
   'all_users', 'supplier',
   '{"field":"dias_para_vencimento","operator":"<=","value":30}'::jsonb,
   'notification',
   '{"priority":"high","template":"homologacao_vencendo"}'::jsonb,
   'daily', 72, true),

  (gen_random_uuid(), 'Homologação Vencida', 'supplier_homologacao_vencida',
   'Alerta crítico quando homologação venceu',
   'all_users', 'supplier',
   '{"field":"dias_para_vencimento","operator":"<","value":0}'::jsonb,
   'notification',
   '{"priority":"urgent","template":"homologacao_vencida"}'::jsonb,
   'daily', 24, true),

  (gen_random_uuid(), 'Fornecedor Não Homologado', 'supplier_nao_homologado',
   'Alerta quando tentam usar fornecedor sem homologação',
   'all_users', 'supplier',
   '{"field":"homologado","operator":"=","value":false}'::jsonb,
   'notification',
   '{"priority":"urgent","template":"supplier_nao_homologado"}'::jsonb,
   'on_event', 0, true);
