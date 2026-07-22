-- password-encryption-audit.sql — Rodada 25/10 (WARN)
-- Roles com senha MD5 sao vulneraveis; SCRAM-SHA-256 e o padrao desde PG10.
\echo '== password-encryption-audit =='
SELECT name, setting FROM pg_settings WHERE name='password_encryption';
SELECT rolname,
       CASE WHEN rolpassword LIKE 'md5%' THEN 'md5'
            WHEN rolpassword LIKE 'SCRAM-SHA-256%' THEN 'scram'
            WHEN rolpassword IS NULL THEN 'none'
            ELSE 'other' END AS algo
  FROM pg_authid
 WHERE rolcanlogin
 ORDER BY algo, rolname;
DO $$
DECLARE v_md5 int; v_setting text;
BEGIN
  SELECT setting INTO v_setting FROM pg_settings WHERE name='password_encryption';
  IF v_setting <> 'scram-sha-256' THEN
    RAISE WARNING 'password_encryption=% (esperado scram-sha-256).', v_setting;
  END IF;
  SELECT count(*) INTO v_md5 FROM pg_authid
   WHERE rolcanlogin AND rolpassword LIKE 'md5%';
  IF v_md5 > 0 THEN
    RAISE WARNING '% role(s) ainda com senha MD5. Migrar via ALTER ROLE ... PASSWORD.', v_md5;
  END IF;
END $$;
\echo 'OK password encryption auditado.'