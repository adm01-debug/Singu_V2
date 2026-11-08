CREATE OR REPLACE FUNCTION trg_fn_recalc_score_after_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM fn_recalcular_supplier_score(NEW.supplier_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_supplier_evaluation_recalc_score
  AFTER INSERT ON supplier_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_recalc_score_after_evaluation();
