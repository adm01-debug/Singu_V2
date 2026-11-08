CREATE OR REPLACE FUNCTION public.fn_validate_deal_stage_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    transition_record RECORD;
BEGIN
    -- Se o estágio não mudou, ok
    IF (OLD.stage_id IS NOT DISTINCT FROM NEW.stage_id) THEN
        RETURN NEW;
    END IF;

    -- Se OLD.stage_id é NULL (novo deal), ok
    IF (OLD.stage_id IS NULL) THEN
        RETURN NEW;
    END IF;

    -- Verificar se existe uma regra explícita para esta transição
    SELECT * INTO transition_record 
    FROM public.pipeline_stage_transitions 
    WHERE pipeline_id = NEW.pipeline_id 
      AND from_stage_id = OLD.stage_id 
      AND to_stage_id = NEW.stage_id;

    -- Se a regra existe e is_allowed é false, bloqueia
    IF FOUND AND transition_record.is_allowed = false THEN
        RAISE EXCEPTION 'Transição de estágio não permitida: de % para %', OLD.stage_id, NEW.stage_id;
    END IF;

    RETURN NEW;
END;
$function$
