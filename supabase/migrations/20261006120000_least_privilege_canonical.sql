-- Least privilege para anon/authenticated no banco canônico (pgxfvjmuubtbowutlide).
--
-- Estado medido antes desta migration:
--   * anon tinha grants em 246 tabelas de public (RLS impedia leitura, mas sem defesa em profundidade);
--   * anon e authenticated tinham TRUNCATE/REFERENCES/TRIGGER em todas as tabelas
--     (TRUNCATE ignora RLS);
--   * anon executava 126 funções de public, quase todas herdadas via PUBLIC;
--   * policies "por token" em csat_surveys e document_signatures aceitavam qualquer linha com token
--     não nulo, ou seja, qualquer sessão (anon ou authenticated) listava as pesquisas e assinaturas
--     de todos os usuários;
--   * a página pública de lead magnet falhava porque anon não tinha SELECT em lead_magnets;
--   * increment_landing_page_view, chamada pela landing page pública, não existia.
--
-- Rotas públicas reais do front (anon) depois desta migration:
--   tabelas: forms, lead_magnets, landing_pages (SELECT) e landing_page_submissions (INSERT);
--   funções: RPCs de deal room, formulário, lead magnet, landing page e pesquisa CSAT por token.
--
-- Rollback: os ACLs anteriores ficam em ops_backup.acl_snapshot (schema não exposto pelo PostgREST).

CREATE SCHEMA IF NOT EXISTS ops_backup;
REVOKE ALL ON SCHEMA ops_backup FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS ops_backup.acl_snapshot (
  captured_at timestamptz NOT NULL DEFAULT now(),
  migration text NOT NULL,
  object_kind text NOT NULL,
  object_name text NOT NULL,
  acl aclitem[]
);
REVOKE ALL ON ops_backup.acl_snapshot FROM PUBLIC, anon, authenticated;

INSERT INTO ops_backup.acl_snapshot (migration, object_kind, object_name, acl)
SELECT '20261006120000', s.object_kind, s.object_name, s.acl
FROM (
  SELECT 'relation' AS object_kind, c.oid::regclass::text AS object_name, c.relacl AS acl
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
  UNION ALL
  SELECT 'function', p.oid::regprocedure::text, p.proacl
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
  UNION ALL
  SELECT 'policy', format('%I.%I', pol.tablename, pol.policyname),
         NULL::aclitem[]
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.tablename IN ('csat_surveys', 'document_signatures')
    AND 'anon' = ANY (pol.roles)
) s
WHERE NOT EXISTS (
  SELECT 1 FROM ops_backup.acl_snapshot b WHERE b.migration = '20261006120000'
);

-- 1. Privilégios que nenhum cliente PostgREST precisa.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM PUBLIC, anon, authenticated;

-- 2. anon só alcança as tabelas das rotas públicas.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

DO $$
BEGIN
  IF to_regclass('public.forms') IS NOT NULL THEN
    GRANT SELECT (id, name, slug, description, fields, redirect_url, success_message, is_published) ON public.forms TO anon;
  END IF;
  IF to_regclass('public.lead_magnets') IS NOT NULL THEN
    GRANT SELECT ON public.lead_magnets TO anon;
  END IF;
  IF to_regclass('public.landing_pages') IS NOT NULL THEN
    GRANT SELECT ON public.landing_pages TO anon;
  END IF;
  IF to_regclass('public.landing_page_submissions') IS NOT NULL THEN
    GRANT INSERT ON public.landing_page_submissions TO anon;
  END IF;

  -- Segredos de cron: somente service_role.
  IF to_regclass('public.cron_secrets') IS NOT NULL THEN
    REVOKE ALL ON public.cron_secrets FROM PUBLIC, authenticated;
  END IF;
  -- Tentativas de login: gravadas apenas por service_role; authenticated só lê (policies admin/próprio).
  IF to_regclass('public.login_attempts') IS NOT NULL THEN
    REVOKE INSERT, UPDATE, DELETE ON public.login_attempts FROM PUBLIC, authenticated;
  END IF;
END $$;

-- 3. Policies por token que expunham linhas de todos os usuários.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('csat_surveys', 'document_signatures')
      AND 'anon' = ANY (roles)
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 4. anon só executa as RPCs públicas; demais funções preservam o acesso de authenticated/service_role.
DO $$
DECLARE
  fn record;
  public_rpcs text[] := ARRAY[
    'public.buyer_add_comment(text,text,text)',
    'public.buyer_toggle_milestone(text,uuid,boolean,text)',
    'public.get_buyer_document_path(text,uuid)',
    'public.get_deal_room_by_token(text)',
    'public.record_buyer_view(text,text)',
    'public.increment_form_view(text)',
    'public.submit_public_form(text,jsonb,jsonb,text,text)',
    'public.increment_magnet_view(text)',
    'public.track_magnet_download(text,text,text,jsonb)',
    'public.increment_landing_page_view(uuid)',
    'public.get_public_csat_survey(uuid)',
    'public.submit_public_csat_survey(uuid,integer,text)'
  ];
  allowed oid[];
BEGIN
  SELECT coalesce(array_agg(to_regprocedure(s)::oid), ARRAY[]::oid[])
    INTO allowed
  FROM unnest(public_rpcs) s
  WHERE to_regprocedure(s) IS NOT NULL;

  FOR fn IN
    SELECT p.oid::regprocedure AS sig,
           EXISTS (
             SELECT 1
             FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
             WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'
           ) AS public_exec
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prokind = 'f'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND NOT (p.oid = ANY (allowed))
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    IF fn.public_exec THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn.sig);
    END IF;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', fn.sig);
  END LOOP;
END $$;

-- 5. RPCs públicas que substituem o acesso direto por token.
CREATE OR REPLACE FUNCTION public.get_public_csat_survey(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF _token IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', s.id,
    'score', s.score,
    'feedback', s.feedback,
    'status', s.status,
    'channel', s.channel,
    'expires_at', s.expires_at
  )
  INTO _result
  FROM public.csat_surveys s
  WHERE s.public_token = _token
  LIMIT 1;

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_public_csat_survey(_token uuid, _score integer, _feedback text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _id uuid;
BEGIN
  IF _token IS NULL OR _score IS NULL OR _score < 0 OR _score > 10 THEN
    RAISE EXCEPTION 'pesquisa ou nota inválida' USING ERRCODE = '22023';
  END IF;

  UPDATE public.csat_surveys
  SET score = _score,
      feedback = nullif(left(btrim(coalesce(_feedback, '')), 1000), ''),
      status = 'answered',
      answered_at = now()
  WHERE public_token = _token
    AND status = 'sent'
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING id INTO _id;

  RETURN _id IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_landing_page_view(page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.landing_pages
  SET view_count = view_count + 1
  WHERE id = page_id
    AND is_published = true;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_csat_survey(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_csat_survey(uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_landing_page_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_csat_survey(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_public_csat_survey(uuid, integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_landing_page_view(uuid) TO anon, authenticated, service_role;
