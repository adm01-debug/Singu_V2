-- Variante EXCLUSIVA do clone local: o legado canônico não tem contact_emails.version.
BEGIN;
DO $local_only$
BEGIN
  IF current_database() !~ '^aut03_[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'Fixture exige banco aut03_ local descartável';
  END IF;
END;
$local_only$;
ALTER TABLE public.contact_emails ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.aut03_fixture_increment_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $fixture$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$fixture$;
REVOKE ALL ON FUNCTION public.aut03_fixture_increment_version() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS aut03_fixture_increment_version ON public.contact_emails;
CREATE TRIGGER aut03_fixture_increment_version BEFORE UPDATE ON public.contact_emails
  FOR EACH ROW EXECUTE FUNCTION public.aut03_fixture_increment_version();
-- Limpeza: descartar o banco clone inteiro após as provas, nunca aplicar como migration.
COMMIT;
