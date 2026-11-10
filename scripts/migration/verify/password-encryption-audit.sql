-- password-encryption-audit.sql — Rodada 25/10 (WARN)
-- Proposito: roles com senha MD5 sao vulneraveis; SCRAM-SHA-256 e o padrao desde PG14.
-- Classe   : AUDIT (RAISE WARNING no achado; nunca falha)
-- Variaveis: nenhuma
-- Saida    : 0.
-- Requer   : SELECT em pg_authid (superuser) para inspecionar os hashes. Sem privilegio
--            (ex.: role postgres do Supabase): avalia so o GUC e pula a lista com NOTICE.
\set ON_ERROR_STOP on
\pset pager off
\echo '== password-encryption-audit =='
SELECT name, setting FROM pg_settings WHERE name='password_encryption';
SELECT has_table_privilege('pg_catalog.pg_authid', 'SELECT') AS le_authid \gset
\if :le_authid
SELECT rolname,
       CASE WHEN rolpassword LIKE 'md5%' THEN 'md5'
            WHEN rolpassword LIKE 'SCRAM-SHA-256%' THEN 'scram'
            WHEN rolpassword IS NULL THEN 'none'
            ELSE 'other' END AS algo
  FROM pg_authid
 WHERE rolcanlogin
 ORDER BY algo, rolname;
\else
\echo 'NOTICE: SKIP sem SELECT em pg_authid — hashes das roles nao inspecionados.'
\endif
DO $$
DECLARE v_md5 int; v_setting text;
BEGIN
  v_setting := current_setting('password_encryption');
  IF v_setting <> 'scram-sha-256' THEN
    RAISE WARNING 'password_encryption=% (esperado scram-sha-256).', v_setting;
  END IF;
  IF has_table_privilege('pg_catalog.pg_authid', 'SELECT') THEN
    EXECUTE 'SELECT count(*) FROM pg_authid WHERE rolcanlogin AND rolpassword LIKE ''md5%''' INTO v_md5;
    IF v_md5 > 0 THEN
      RAISE WARNING '% role(s) ainda com senha MD5. Migrar via ALTER ROLE ... PASSWORD.', v_md5;
    END IF;
  END IF;
END $$;
\echo 'OK password encryption auditado.'
