-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181412
-- nome:   create_trigger_auto_update_homologado_flag

CREATE OR REPLACE FUNCTION trg_fn_update_homologado_flag()
RETURNS TRIGGER AS $$
DECLARE
  v_validade_dias INTEGER;
BEGIN
  -- Buscar validade configurada
  SELECT valor::integer INTO v_validade_dias 
  FROM config_regras_negocio WHERE chave = 'HOMOLOGACAO_VALIDADE_DIAS';

  IF NEW.status = 'homologado' THEN
    UPDATE suppliers SET 
      homologado = true,
      data_homologacao = CURRENT_DATE
    WHERE id = NEW.supplier_id;
    
    -- Setar validade se não foi informada manualmente
    IF NEW.validade IS NULL THEN
      NEW.validade := CURRENT_DATE + (v_validade_dias || ' days')::interval;
    END IF;
    NEW.data_decisao := COALESCE(NEW.data_decisao, NOW());

  ELSIF NEW.status IN ('reprovado', 'suspenso', 'vencido') THEN
    UPDATE suppliers SET 
      homologado = false
    WHERE id = NEW.supplier_id;
    
    IF NEW.status IN ('reprovado', 'suspenso') THEN
      NEW.data_decisao := COALESCE(NEW.data_decisao, NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- No INSERT: quando cria uma homologação já com status definido
CREATE TRIGGER trg_homologation_insert_update_flag
  BEFORE INSERT ON supplier_homologations
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_update_homologado_flag();

-- No UPDATE: quando muda o status de uma homologação existente
CREATE TRIGGER trg_homologation_update_update_flag
  BEFORE UPDATE OF status ON supplier_homologations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trg_fn_update_homologado_flag();
