-- Global Least Privilege para anon.
-- Invariante: apenas as 4 tabelas das rotas públicas (formulário, lead magnet e landing page)
-- podem ter QUALQUER privilégio concedido ao papel anon — tabelas, views e materialized views.
-- Deal rooms e pesquisas CSAT públicas usam RPCs SECURITY DEFINER por token, sem grant de tabela.
\set ON_ERROR_STOP on

\echo 'TEST: exatamente 4 relações em public com privilégio efetivo (tabela ou coluna) para anon'
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
  WITH granted AS (
    SELECT c.relname
      FROM pg_class c
     WHERE c.relnamespace = 'public'::regnamespace
       AND c.relkind IN ('r','p','v','m','f')
       AND (has_any_column_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
            OR has_table_privilege('anon', c.oid, 'DELETE, TRUNCATE, TRIGGER'))
  )
  SELECT string_agg(relname, ', ' ORDER BY relname) FILTER (WHERE relname <> ALL (allowed)),
         count(*)
    INTO offenders, n
    FROM granted;

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION '❌ Relações com privilégio inesperado para anon: %', offenders;
  END IF;
  IF n <> 4 THEN
    RAISE EXCEPTION '❌ Esperado 4 relações com privilégio para anon; encontrado %', n;
  END IF;
  RAISE NOTICE '✅ Exatamente 4 relações com privilégio para anon (least privilege global).';
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