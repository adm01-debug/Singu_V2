CREATE OR REPLACE FUNCTION public.sync_nlp_to_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_TABLE_NAME = 'vak_analysis_history') THEN
        -- Calculate dominant system
        UPDATE public.contacts 
        SET vak_dominant = CASE 
            WHEN NEW.visual_score >= GREATEST(NEW.auditory_score, NEW.kinesthetic_score, NEW.digital_score) THEN 'V'
            WHEN NEW.auditory_score >= GREATEST(NEW.visual_score, NEW.kinesthetic_score, NEW.digital_score) THEN 'A'
            WHEN NEW.kinesthetic_score >= GREATEST(NEW.visual_score, NEW.auditory_score, NEW.digital_score) THEN 'K'
            ELSE 'D'
        END
        WHERE id = NEW.contact_id;
    ELSIF (TG_TABLE_NAME = 'metaprogram_analysis') THEN
        UPDATE public.contacts 
        SET 
            motivation_direction = CASE 
                WHEN NEW.toward_score > NEW.away_from_score THEN 'toward' 
                WHEN NEW.away_from_score > NEW.toward_score THEN 'away_from' 
                ELSE 'balanced' 
            END,
            working_style = CASE 
                WHEN NEW.options_score > NEW.procedures_score THEN 'options' 
                WHEN NEW.procedures_score > NEW.options_score THEN 'procedures' 
                ELSE 'balanced' 
            END
        WHERE id = NEW.contact_id;
    END IF;
    RETURN NEW;
END;
$function$
