CREATE OR REPLACE FUNCTION fn_supplier_bulk_recalc()
RETURNS JSON AS $$
DECLARE
  v_rec RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT se.supplier_id
    FROM supplier_evaluations se
  LOOP
    PERFORM fn_recalcular_supplier_score(v_rec.supplier_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('recalculated', v_count, 'executed_at', NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_supplier_bulk_recalc IS 
'Recalcula score de TODOS os fornecedores que possuem avaliações. 
Usar quando alterar pesos em config_regras_negocio.';
