-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330122025
-- nome:   create_carrier_triggers

-- ===== TRIGGER FUNCTIONS =====

-- Passo 24: Recalc score após avaliação
CREATE OR REPLACE FUNCTION trg_fn_carrier_recalc_score_after_evaluation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM fn_recalcular_carrier_score(NEW.carrier_id);
  RETURN NEW;
END;
$function$;

-- Passo 25: Atualizar carriers.homologado ao mudar homologação
CREATE OR REPLACE FUNCTION trg_fn_carrier_update_homologado_flag()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_validade_dias INTEGER;
BEGIN
  SELECT valor::integer INTO v_validade_dias 
  FROM config_regras_negocio WHERE chave = 'CARRIER_HOMOLOGACAO_VALIDADE_DIAS';

  IF NEW.status = 'homologado' THEN
    UPDATE carriers SET 
      homologado = true,
      data_homologacao = CURRENT_DATE
    WHERE id = NEW.carrier_id;
    
    IF NEW.validade IS NULL THEN
      NEW.validade := CURRENT_DATE + (v_validade_dias || ' days')::interval;
    END IF;
    NEW.data_decisao := COALESCE(NEW.data_decisao, NOW());

  ELSIF NEW.status IN ('reprovado', 'suspenso', 'vencido') THEN
    UPDATE carriers SET 
      homologado = false
    WHERE id = NEW.carrier_id;
    
    IF NEW.status IN ('reprovado', 'suspenso') THEN
      NEW.data_decisao := COALESCE(NEW.data_decisao, NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Passo 26: Prevent UPDATE em carrier_evaluations (append-only)
CREATE OR REPLACE FUNCTION trg_fn_prevent_carrier_evaluation_update()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'Avaliações de transportadora são imutáveis. Não é possível alterar registros existentes. Crie uma nova avaliação.';
  RETURN NULL;
END;
$function$;

-- Passo 27: Protect DELETE de carrier_qualification_config em uso
CREATE OR REPLACE FUNCTION trg_fn_protect_carrier_qualification_config()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS(SELECT 1 FROM carrier_scores WHERE segment_code = OLD.segment_code) THEN
    RAISE EXCEPTION 'Não é possível deletar segmento "%" pois existem transportadoras classificadas nele.', OLD.segment_code;
  END IF;
  RETURN OLD;
END;
$function$;

-- ===== TRIGGERS =====

-- Passo 24: Recalc score ao inserir avaliação
CREATE TRIGGER trg_carrier_evaluation_recalc_score
  AFTER INSERT ON carrier_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_carrier_recalc_score_after_evaluation();

-- Passo 25a: Atualizar flag ao INSERT em carrier_homologations
CREATE TRIGGER trg_carrier_homologation_insert_update_flag
  BEFORE INSERT ON carrier_homologations
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_carrier_update_homologado_flag();

-- Passo 25b: Atualizar flag ao UPDATE de status em carrier_homologations
CREATE TRIGGER trg_carrier_homologation_update_update_flag
  BEFORE UPDATE OF status ON carrier_homologations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trg_fn_carrier_update_homologado_flag();

-- Passo 26: Bloqueia UPDATE em carrier_evaluations
CREATE TRIGGER trg_prevent_carrier_evaluation_update
  BEFORE UPDATE ON carrier_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_prevent_carrier_evaluation_update();

-- Passo 27: Protege DELETE em carrier_qualification_config
CREATE TRIGGER trg_protect_carrier_qualification_config_delete
  BEFORE DELETE ON carrier_qualification_config
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_protect_carrier_qualification_config();

-- Passo 28: Triggers de updated_at (reutiliza update_updated_at_column() genérica)
CREATE TRIGGER trg_carrier_homologations_updated_at
  BEFORE UPDATE ON carrier_homologations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_carrier_scores_updated_at
  BEFORE UPDATE ON carrier_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_carrier_qualification_config_updated_at
  BEFORE UPDATE ON carrier_qualification_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON FUNCTION trg_fn_carrier_recalc_score_after_evaluation() IS 'Trigger: recalcula score da transportadora após inserir avaliação';
COMMENT ON FUNCTION trg_fn_carrier_update_homologado_flag() IS 'Trigger: atualiza carriers.homologado + calcula validade ao mudar homologação';
COMMENT ON FUNCTION trg_fn_prevent_carrier_evaluation_update() IS 'Trigger: bloqueia UPDATE em carrier_evaluations (append-only)';
COMMENT ON FUNCTION trg_fn_protect_carrier_qualification_config() IS 'Trigger: impede DELETE de segmento em uso por transportadoras';
