-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260331124630
-- nome:   fix_b2_vw_carrier_evaluations_history_deleted_at

DROP VIEW IF EXISTS vw_carrier_evaluations_history;

CREATE VIEW vw_carrier_evaluations_history AS
SELECT co.nome_crm AS transportadora,
  ce.data_avaliacao, ce.referencia,
  ce.nota_pontualidade, ce.nota_conservacao, ce.nota_preco_frete,
  ce.nota_rastreamento, ce.nota_cobertura, ce.nota_geral,
  ce.comentario,
  u.name AS avaliador, u.departamento AS departamento_avaliador,
  ca.id AS carrier_id, ca.company_id,
  ce.id AS evaluation_id, ce.created_at
FROM carrier_evaluations ce
  JOIN carriers ca ON ca.id = ce.carrier_id
  JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
  JOIN users u ON u.id = ce.avaliador_id
ORDER BY ce.data_avaliacao DESC, ce.created_at DESC;

COMMENT ON VIEW vw_carrier_evaluations_history IS 'Histórico de avaliações de transportadoras. FIX B2: filtra deleted_at IS NULL.';
