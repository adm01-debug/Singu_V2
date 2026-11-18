CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_emails FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();

CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_phones FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();

CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_addresses FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();

CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_social_media FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();
