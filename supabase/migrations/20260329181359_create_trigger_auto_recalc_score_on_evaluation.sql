-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181359
-- nome:   create_trigger_auto_recalc_score_on_evaluation

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
