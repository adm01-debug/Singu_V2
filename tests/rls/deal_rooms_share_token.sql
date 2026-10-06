-- Testes RLS — deal rooms públicos via share_token.
-- Desenho: anon não tem nenhum privilégio nas tabelas de deal room; o portal do comprador usa
-- apenas RPCs SECURITY DEFINER que localizam a sala por share_token com share_enabled = true,
-- têm search_path fixo e não dependem de auth.uid().

\set ON_ERROR_STOP on

\echo 'TEST: RLS habilitado nas tabelas de deal room'
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['deal_rooms','deal_room_milestones','deal_room_stakeholders',
                           'deal_room_documents','deal_room_comments','deal_room_activities'] LOOP
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || t)::regclass) THEN
      RAISE EXCEPTION '❌ RLS desabilitado em %', t;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ RLS ativo em todas as tabelas de deal room';
END $$;

\echo 'TEST: anon sem nenhum privilégio nas tabelas de deal room'
DO $$
DECLARE t text; priv text;
BEGIN
  FOREACH t IN ARRAY ARRAY['deal_rooms','deal_room_milestones','deal_room_stakeholders',
                           'deal_room_documents','deal_room_comments','deal_room_activities'] LOOP
    FOREACH priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE'] LOOP
      IF has_table_privilege('anon', 'public.' || t, priv) THEN
        RAISE EXCEPTION '❌ anon tem % em %', priv, t;
      END IF;
    END LOOP;
    IF has_any_column_privilege('anon', 'public.' || t, 'SELECT')
       OR has_any_column_privilege('anon', 'public.' || t, 'UPDATE') THEN
      RAISE EXCEPTION '❌ anon tem privilégio de coluna em %', t;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ anon sem acesso direto às tabelas de deal room';
END $$;

\echo 'TEST: RPCs do portal do comprador exigem share_enabled e não usam auth.uid()'
DO $$
DECLARE
  sig text;
  fn regprocedure;
  p record;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.get_deal_room_by_token(text)',
    'public.record_buyer_view(text,text)',
    'public.get_buyer_document_path(text,uuid)',
    'public.buyer_add_comment(text,text,text)',
    'public.buyer_toggle_milestone(text,uuid,boolean,text)'
  ] LOOP
    fn := to_regprocedure(sig);
    IF fn IS NULL THEN
      RAISE EXCEPTION '❌ RPC pública % não existe', sig;
    END IF;
    SELECT prosrc, prosecdef, proconfig INTO p FROM pg_proc WHERE oid = fn;
    IF p.prosrc NOT ILIKE '%share_token%' OR p.prosrc NOT ILIKE '%share_enabled%' THEN
      RAISE EXCEPTION '❌ % não valida share_token + share_enabled', sig;
    END IF;
    IF p.prosrc ILIKE '%auth.uid()%' THEN
      RAISE EXCEPTION '❌ % usa auth.uid() (anon recebe NULL)', sig;
    END IF;
    IF p.prosecdef AND (p.proconfig IS NULL OR array_to_string(p.proconfig, ',') NOT LIKE '%search_path=%') THEN
      RAISE EXCEPTION '❌ % é DEFINER sem search_path fixo', sig;
    END IF;
    IF NOT has_function_privilege('anon', fn, 'EXECUTE') THEN
      RAISE EXCEPTION '❌ anon não executa % (portal do comprador quebrado)', sig;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ RPCs do portal do comprador validam token e share_enabled';
END $$;
