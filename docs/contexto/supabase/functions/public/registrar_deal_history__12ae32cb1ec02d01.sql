CREATE OR REPLACE FUNCTION public.registrar_deal_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
        INSERT INTO deal_history (deal_id, campo, valor_anterior, valor_novo, stage_anterior_id, stage_novo_id)
        VALUES (NEW.id, 'stage_id', OLD.stage_id::TEXT, NEW.stage_id::TEXT, OLD.stage_id, NEW.stage_id);
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO deal_history (deal_id, campo, valor_anterior, valor_novo)
        VALUES (NEW.id, 'status', OLD.status::TEXT, NEW.status::TEXT);
    END IF;
    
    IF OLD.valor IS DISTINCT FROM NEW.valor THEN
        INSERT INTO deal_history (deal_id, campo, valor_anterior, valor_novo)
        VALUES (NEW.id, 'valor', OLD.valor::TEXT, NEW.valor::TEXT);
    END IF;
    
    RETURN NEW;
END;
$function$
