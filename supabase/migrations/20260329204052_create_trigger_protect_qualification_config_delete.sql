-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329204052
-- nome:   create_trigger_protect_qualification_config_delete

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
