-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329204121
-- nome:   protect_evaluations_immutable

-- Avaliações são registros de auditoria — não podem ser alterados, apenas inseridos
CREATE OR REPLACE FUNCTION trg_fn_prevent_evaluation_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Avaliações de fornecedor são imutáveis. Não é possível alterar registros existentes. Crie uma nova avaliação.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_evaluation_update
  BEFORE UPDATE ON supplier_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_prevent_evaluation_update();

COMMENT ON TRIGGER trg_prevent_evaluation_update ON supplier_evaluations IS 
'Avaliações são append-only para garantir auditabilidade. Não permite UPDATE.';
