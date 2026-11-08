CREATE OR REPLACE FUNCTION public.registrar_lead_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
        INSERT INTO lead_history (lead_id, campo, valor_anterior, valor_novo, stage_anterior_id, stage_novo_id)
        VALUES (NEW.id, 'stage_id', OLD.stage_id::TEXT, NEW.stage_id::TEXT, OLD.stage_id, NEW.stage_id);
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_history (lead_id, campo, valor_anterior, valor_novo)
        VALUES (NEW.id, 'status', OLD.status::TEXT, NEW.status::TEXT);
    END IF;
    
    IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
        INSERT INTO lead_history (lead_id, campo, valor_anterior, valor_novo)
        VALUES (NEW.id, 'owner_id', OLD.owner_id::TEXT, NEW.owner_id::TEXT);
    END IF;
    
    RETURN NEW;
END;
$function$
