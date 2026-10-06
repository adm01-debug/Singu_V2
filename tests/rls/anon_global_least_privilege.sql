-- Global Least Privilege para anon.
-- Invariante: apenas as 4 tabelas das rotas públicas (formulário, lead magnet e landing page)
-- podem ter QUALQUER privilégio concedido ao papel anon — tabelas, views e materialized views.
-- Deal rooms e pesquisas CSAT públicas usam RPCs SECURITY DEFINER por token, sem grant de tabela.
\set ON_ERROR_STOP on

\echo 'TEST: exatamente 4 relações em public com grants a anon'
DO $$
DECLARE
  n INT;
  allowed TEXT[] := ARRAY[
    'forms',
    'landing_pages',
    'landing_page_submissions',
    'lead_magnets'
  ];
  offenders TEXT;
BEGIN
  WITH t AS (
    SELECT c.relname, (aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner)))).grantee AS grantee
      FROM pg_class c
      JOIN pg_namespace nn ON nn.oid = c.relnamespace
     WHERE nn.nspname='public' AND c.relkind IN ('r','p','v','m','f')
  ), granted AS (
    SELECT DISTINCT t.relname
      FROM t JOIN pg_roles r ON r.oid = t.grantee
     WHERE r.rolname = 'anon'
  )
  SELECT string_agg(relname, ', ') INTO offenders
  FROM granted
  WHERE relname <> ALL (allowed);

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION '❌ Tabelas com grants inesperados a anon: %', offenders;
  END IF;

  SELECT count(*) INTO n FROM (
    SELECT DISTINCT t.relname
      FROM (
        SELECT c.relname, (aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner)))).grantee AS grantee
          FROM pg_class c
          JOIN pg_namespace nn ON nn.oid = c.relnamespace
         WHERE nn.nspname='public' AND c.relkind IN ('r','p','v','m','f')
      ) t JOIN pg_roles r ON r.oid = t.grantee
     WHERE r.rolname='anon'
  ) x;

  IF n <> 4 THEN
    RAISE EXCEPTION '❌ Esperado 4 relações com grants a anon; encontrado %', n;
  END IF;
  RAISE NOTICE '✅ Exatamente 4 relações com grants a anon (least privilege global).';
END $$;

\echo 'TEST: anon NÃO tem SELECT em tabelas sensíveis'
DO $$
DECLARE r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['contacts','companies','deals','user_roles','audit_log','login_attempts','profiles','ai_chat_messages'] LOOP
    IF has_table_privilege('anon', 'public.'||r, 'SELECT') THEN
      RAISE EXCEPTION '❌ anon ainda tem SELECT em %', r;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ anon sem SELECT em tabelas sensíveis';
END $$;