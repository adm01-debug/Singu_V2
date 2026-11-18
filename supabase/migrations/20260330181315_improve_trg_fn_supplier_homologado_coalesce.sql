-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330181315
-- nome:   improve_trg_fn_supplier_homologado_coalesce

CREATE OR REPLACE FUNCTION trg_fn_update_homologado_flag()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_validade_dias INTEGER;
BEGIN
  -- FIX O1: COALESCE protege contra config deletada (fallback 365 dias)
  SELECT COALESCE(valor::integer, 365) INTO v_validade_dias 
  FROM config_regras_negocio WHERE chave = 'HOMOLOGACAO_VALIDADE_DIAS';
  IF v_validade_dias IS NULL THEN v_validade_dias := 365; END IF;

  IF NEW.status = 'homologado' THEN
    UPDATE suppliers SET 
      homologado = true,
      data_homologacao = CURRENT_DATE
    WHERE id = NEW.supplier_id;
    
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
$function$;

COMMENT ON FUNCTION trg_fn_update_homologado_flag() IS 'Trigger: atualiza suppliers.homologado + calcula validade. FIX: COALESCE protege contra config deletada (fallback 365d).';
