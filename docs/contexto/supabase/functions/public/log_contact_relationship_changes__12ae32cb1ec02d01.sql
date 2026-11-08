CREATE OR REPLACE FUNCTION public.log_contact_relationship_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Log Score Change
    IF (OLD.relationship_score IS DISTINCT FROM NEW.relationship_score) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'score', OLD.relationship_score::text, NEW.relationship_score::text, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Atualização de score detectada');
    END IF;

    -- Log Stage Change
    IF (OLD.relationship_stage IS DISTINCT FROM NEW.relationship_stage) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'stage', OLD.relationship_stage, NEW.relationship_stage, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Mudança de estágio do funil');
    END IF;

    -- Log Sentiment Change
    IF (OLD.sentiment IS DISTINCT FROM NEW.sentiment) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'sentiment', OLD.sentiment, NEW.sentiment, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Análise de sentimento atualizada');
    END IF;

    RETURN NEW;
END;
$function$
