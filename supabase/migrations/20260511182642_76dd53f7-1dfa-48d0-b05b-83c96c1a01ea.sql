-- Create the trigger for contact_relatives audit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'tr_contact_relatives_audit') THEN
        CREATE TRIGGER tr_contact_relatives_audit
        AFTER INSERT OR UPDATE OR DELETE ON public.contact_relatives
        FOR EACH ROW EXECUTE FUNCTION public.process_contact_relatives_audit();
    END IF;
END $$;