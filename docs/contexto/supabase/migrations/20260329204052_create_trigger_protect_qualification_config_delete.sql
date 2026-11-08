CREATE OR REPLACE FUNCTION trg_fn_protect_qualification_config()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM supplier_scores WHERE segment_code = OLD.segment_code) THEN
    RAISE EXCEPTION 'Não é possível deletar segmento "%" pois existem fornecedores classificados nele.', OLD.segment_code;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_qualification_config_delete
  BEFORE DELETE ON supplier_qualification_config
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_protect_qualification_config();
