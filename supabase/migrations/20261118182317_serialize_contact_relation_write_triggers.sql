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

DO $install$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'contact_emails', 'contact_phones', 'contact_addresses', 'contact_social_media'
  ] LOOP
    IF to_regclass(format('public.%I', relation_name)) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS serialize_contact_relation_write ON public.%I', relation_name);
    EXECUTE format('CREATE TRIGGER serialize_contact_relation_write
      BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW
      EXECUTE FUNCTION public.guard_contact_relation_write()', relation_name);
  END LOOP;
END;
$install$;
