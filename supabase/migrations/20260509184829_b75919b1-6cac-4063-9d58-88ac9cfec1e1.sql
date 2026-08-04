-- 1. Register LifeEvents for audit
DROP TRIGGER IF EXISTS tr_log_life_events_change ON public.life_events;
CREATE TRIGGER tr_log_life_events_change 
AFTER INSERT OR UPDATE OR DELETE ON public.life_events 
FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();

-- 2. Refine log_behavioral_change to handle deletes and generic formatting
CREATE OR REPLACE FUNCTION public.log_behavioral_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_contact_id UUID;
    v_old_json JSONB := NULL;
    v_new_json JSONB := NULL;
    v_reason TEXT;
BEGIN
    -- Try to get current user ID
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_contact_id := OLD.contact_id;
        v_old_json := to_jsonb(OLD);
        v_reason := 'Remoção de registro em ' || TG_TABLE_NAME;
    ELSE
        v_contact_id := NEW.contact_id;
        v_new_json := to_jsonb(NEW);
        IF (TG_OP = 'INSERT') THEN
            v_reason := 'Novo registro em ' || TG_TABLE_NAME;
        ELSE
            v_old_json := to_jsonb(OLD);
            v_reason := 'Atualização de registro em ' || TG_TABLE_NAME;
        END IF;
    END IF;

    INSERT INTO public.crm_relationship_audit_logs (
        contact_id,
        user_id,
        change_source,
        field_name,
        old_value,
        new_value,
        reason
    ) VALUES (
        v_contact_id,
        v_user_id,
        'manual',
        TG_TABLE_NAME,
        v_old_json::TEXT,
        v_new_json::TEXT,
        v_reason
    );
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
