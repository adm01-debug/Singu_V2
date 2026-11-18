-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20261118182317
-- nome:   serialize_contact_relation_write_triggers

CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_emails FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();

CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_phones FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();

CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_addresses FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();

CREATE TRIGGER serialize_contact_relation_write BEFORE INSERT OR UPDATE OR DELETE
  ON public.contact_social_media FOR EACH ROW EXECUTE FUNCTION public.guard_contact_relation_write();
