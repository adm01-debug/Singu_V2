-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181542
-- nome:   create_vw_supplier_evaluations_history

CREATE VIEW vw_supplier_evaluations_history AS
SELECT 
  co.nome_crm AS fornecedor,
  se.data_avaliacao,
  se.referencia,
  se.nota_preco,
  se.nota_prazo,
  se.nota_qualidade,
  se.nota_entrega,
  se.nota_geral,
  se.comentario,
  u.name AS avaliador,
  u.departamento AS departamento_avaliador,
  s.id AS supplier_id,
  s.company_id,
  se.id AS evaluation_id,
  se.created_at
FROM supplier_evaluations se
JOIN suppliers s ON s.id = se.supplier_id
JOIN companies co ON co.id = s.company_id
JOIN users u ON u.id = se.avaliador_id
ORDER BY se.data_avaliacao DESC, se.created_at DESC;
