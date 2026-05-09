-- Function to log behavioral changes
CREATE OR REPLACE FUNCTION public.log_behavioral_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Try to get current user ID (might be null if not in auth context)
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    INSERT INTO public.crm_relationship_audit_logs (
        contact_id,
        user_id,
        change_type,
        old_value,
        new_value,
        reason
    ) VALUES (
        NEW.contact_id,
        v_user_id,
        'manual_correction', -- Behavioral changes are usually manual for now
        jsonb_build_object('table', TG_TABLE_NAME, 'data', to_jsonb(OLD)),
        jsonb_build_object('table', TG_TABLE_NAME, 'data', to_jsonb(NEW)),
        'Atualização de perfil comportamental (' || TG_TABLE_NAME || ')'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for behavioral tables
CREATE TRIGGER log_contact_behavior_change AFTER UPDATE ON public.contact_behavior FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();
CREATE TRIGGER log_contact_decision_change AFTER UPDATE ON public.contact_decision_making FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();
CREATE TRIGGER log_contact_influence_change AFTER UPDATE ON public.contact_influence FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();
CREATE TRIGGER log_contact_business_change AFTER UPDATE ON public.contact_business_context FOR EACH ROW EXECUTE FUNCTION public.log_behavioral_change();
