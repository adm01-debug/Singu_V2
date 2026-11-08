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
