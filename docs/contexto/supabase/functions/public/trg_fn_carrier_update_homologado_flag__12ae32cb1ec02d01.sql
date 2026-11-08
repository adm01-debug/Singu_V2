CREATE OR REPLACE FUNCTION public.trg_fn_carrier_update_homologado_flag()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_validade_dias INTEGER;
BEGIN
  -- FIX O1: COALESCE protege contra config deletada (fallback 365 dias)
  SELECT COALESCE(valor::integer, 365) INTO v_validade_dias 
  FROM config_regras_negocio WHERE chave = 'CARRIER_HOMOLOGACAO_VALIDADE_DIAS';
  IF v_validade_dias IS NULL THEN v_validade_dias := 365; END IF;

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
$function$
