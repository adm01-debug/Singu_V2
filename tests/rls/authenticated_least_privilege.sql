-- Rodada 46/10 — Least Privilege para o papel `authenticated`.
-- Invariante 1: authenticated NÃO tem TRUNCATE/REFERENCES/TRIGGER em nenhuma tabela public.*
-- Invariante 2: authenticated NÃO tem qualquer privilégio na lista service-role-only.
-- Invariante 3: authenticated só LÊ login_attempts (escrita é exclusiva de service_role).
-- audit_log, error_logs, system_config etc. são lidos pelas telas administrativas via RLS
-- (has_role admin / dono) e por isso não entram na lista service-role-only.
\set ON_ERROR_STOP on

\echo 'TEST: authenticated sem TRUNCATE/REFERENCES/TRIGGER em public.*'
DO $$
DECLARE offenders TEXT;
BEGIN
  SELECT string_agg(c.relname || '(' || priv || ')', ', ')
    INTO offenders
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace,
       LATERAL (VALUES ('TRUNCATE'),('REFERENCES'),('TRIGGER')) AS p(priv)
  WHERE n.nspname='public' AND c.relkind='r'
    AND has_table_privilege('authenticated', c.oid, priv);
  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION '❌ authenticated ainda tem privilégios perigosos: %', offenders;
  END IF;
  RAISE NOTICE '✅ authenticated sem TRUNCATE/REFERENCES/TRIGGER em public.*';
END $$;

\echo 'TEST: authenticated bloqueado em tabelas service-role-only'
DO $$
DECLARE
  t TEXT;
  offenders TEXT := '';
  service_only TEXT[] := ARRAY['cron_secrets'];
BEGIN
  FOREACH t IN ARRAY service_only LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                WHERE n.nspname='public' AND c.relname=t) THEN
      IF has_table_privilege('authenticated', 'public.'||t, 'SELECT')
         OR has_table_privilege('authenticated', 'public.'||t, 'INSERT')
         OR has_table_privilege('authenticated', 'public.'||t, 'UPDATE')
         OR has_table_privilege('authenticated', 'public.'||t, 'DELETE') THEN
        offenders := offenders || t || ' ';
      END IF;
    END IF;
  END LOOP;
  IF length(offenders) > 0 THEN
    RAISE EXCEPTION '❌ authenticated ainda acessa: %', offenders;
  END IF;
  RAISE NOTICE '✅ authenticated bloqueado em tabelas service-role-only';
END $$;

\echo 'TEST: authenticated sem escrita em login_attempts'
DO $$
BEGIN
  IF to_regclass('public.login_attempts') IS NULL THEN
    RAISE NOTICE '✅ login_attempts não existe';
    RETURN;
  END IF;
  IF has_table_privilege('authenticated', 'public.login_attempts', 'INSERT')
     OR has_table_privilege('authenticated', 'public.login_attempts', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.login_attempts', 'DELETE') THEN
    RAISE EXCEPTION '❌ authenticated ainda escreve em login_attempts';
  END IF;
  RAISE NOTICE '✅ authenticated só lê login_attempts';
END $$;
