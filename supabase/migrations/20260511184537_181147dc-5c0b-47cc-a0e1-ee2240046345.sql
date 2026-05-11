CREATE OR REPLACE TRIGGER on_contact_relatives_change
AFTER INSERT OR UPDATE OR DELETE ON public.contact_relatives
FOR EACH ROW EXECUTE FUNCTION public.process_contact_relatives_audit();