-- fdw-credentials-audit.sql — Detecta FDW user mappings com password plaintext.
\set ON_ERROR_STOP on
\pset pager off

SELECT srvname, srvtype, srvoptions FROM pg_foreign_server ORDER BY srvname;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad FROM pg_user_mapping um
   WHERE EXISTS (
     SELECT 1 FROM unnest(um.umoptions) o
      WHERE o ILIKE 'password=%' AND o NOT ILIKE 'password_required=%'
   );
  IF v_bad > 0 THEN
    RAISE WARNING 'FDW LEAK: % mapping(s) com password plaintext', v_bad;
  ELSE
    RAISE NOTICE 'OK Nenhum FDW mapping com password plaintext';
  END IF;
END
$BODY$;