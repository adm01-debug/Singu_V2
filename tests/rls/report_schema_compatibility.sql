BEGIN;

CREATE SCHEMA rls_report_compat;
CREATE TABLE rls_report_compat.companies (id integer);
CREATE TABLE rls_report_compat.contacts (id integer, relationship_score integer, updated_at timestamptz);
CREATE TABLE rls_report_compat.deals (id integer, value numeric);
CREATE TABLE rls_report_compat.interactions (id integer, created_at timestamptz);
CREATE TABLE rls_report_compat.audit_events (event text);
INSERT INTO rls_report_compat.contacts VALUES (1, 42, '2020-01-01T00:00:00Z');
INSERT INTO rls_report_compat.deals VALUES (1, 123.45);
INSERT INTO rls_report_compat.interactions VALUES (1, '2020-01-02T00:00:00Z');
CREATE FUNCTION rls_report_compat.record_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE rls_report_compat.contacts SET relationship_score = relationship_score + 1, updated_at = now();
  INSERT INTO rls_report_compat.audit_events VALUES (TG_TABLE_NAME);
  RETURN NEW;
END $$;
CREATE TRIGGER relationship_update AFTER UPDATE ON rls_report_compat.interactions
  FOR EACH ROW EXECUTE FUNCTION rls_report_compat.record_update();
CREATE TRIGGER deal_update AFTER UPDATE ON rls_report_compat.deals
  FOR EACH ROW EXECUTE FUNCTION rls_report_compat.record_update();
SELECT set_config('rls.compatibility_migration', replace(replace(:'compatibility_migration',
  'public.', 'rls_report_compat.'), '''public''', '''rls_report_compat'''), true);
DO $$
BEGIN
  EXECUTE current_setting('rls.compatibility_migration');
  EXECUTE current_setting('rls.compatibility_migration');
  IF (SELECT data_interacao FROM rls_report_compat.interactions) IS DISTINCT FROM '2020-01-02T00:00:00Z'::timestamptz
      OR (SELECT valor FROM rls_report_compat.deals) IS DISTINCT FROM 123.45::numeric THEN
    RAISE EXCEPTION 'Compatibilidade não recuperou datas/valores legados';
  END IF;
  IF EXISTS (SELECT 1 FROM rls_report_compat.audit_events)
      OR EXISTS (SELECT 1 FROM rls_report_compat.contacts WHERE relationship_score IS DISTINCT FROM 42
        OR updated_at IS DISTINCT FROM '2020-01-01T00:00:00Z'::timestamptz) THEN
    RAISE EXCEPTION 'Compatibilidade disparou gatilhos e alterou histórico/score/updated_at';
  END IF;
END $$;
ROLLBACK;
