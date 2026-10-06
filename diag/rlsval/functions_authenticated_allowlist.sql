-- Allowlist de funções expostas — ver docs/qa/functions-authenticated-allowlist.md.
-- Invariante 1: anon executa EXATAMENTE as RPCs públicas listadas.
-- Invariante 2: authenticated executa, entre as SECURITY DEFINER (que ignoram RLS), EXATAMENTE as
--               RPCs públicas + has_role. Funções SECURITY INVOKER rodam sob RLS e não entram aqui.
-- Falha se aparecer função extra ou se alguma da allowlist perder o grant.

BEGIN;

CREATE TEMP TABLE _public_rpc(sig text PRIMARY KEY);
INSERT INTO _public_rpc(sig) VALUES
  ('buyer_add_comment(_token text, _body text, _label text)'),
  ('buyer_toggle_milestone(_token text, _milestone_id uuid, _done boolean, _label text)'),
  ('get_buyer_document_path(_token text, _document_id uuid)'),
  ('get_deal_room_by_token(_token text)'),
  ('get_public_csat_survey(_token uuid)'),
  ('increment_form_view(_slug text)'),
  ('increment_landing_page_view(page_id uuid)'),
  ('increment_magnet_view(_slug text)'),
  ('record_buyer_view(_token text, _label text)'),
  ('submit_public_csat_survey(_token uuid, _score integer, _feedback text)'),
  ('submit_public_form(_slug text, _data jsonb, _utms jsonb, _page_url text, _user_agent text)'),
  ('track_magnet_download(_slug text, _email text, _name text, _utms jsonb)');

CREATE TEMP TABLE _definer_auth(sig text PRIMARY KEY);
INSERT INTO _definer_auth SELECT sig FROM _public_rpc;
INSERT INTO _definer_auth(sig) VALUES ('has_role(_user_id uuid, _role app_role)');

CREATE TEMP TABLE _fn AS
SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig,
       p.prosecdef,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.prokind = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_depend d
    WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
  );

DO $$
DECLARE
  extra text;
  missing text;
BEGIN
  SELECT string_agg(sig, ', ' ORDER BY sig) INTO extra
  FROM _fn WHERE anon_exec AND sig NOT IN (SELECT sig FROM _public_rpc);
  IF extra IS NOT NULL THEN
    RAISE EXCEPTION 'anon executa função(ões) fora da allowlist pública: %', extra;
  END IF;

  SELECT string_agg(w.sig, ', ' ORDER BY w.sig) INTO missing
  FROM _public_rpc w WHERE NOT EXISTS (SELECT 1 FROM _fn f WHERE f.sig = w.sig AND f.anon_exec);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'RPC(s) pública(s) sem EXECUTE para anon: %', missing;
  END IF;

  SELECT string_agg(sig, ', ' ORDER BY sig) INTO extra
  FROM _fn WHERE prosecdef AND auth_exec AND sig NOT IN (SELECT sig FROM _definer_auth);
  IF extra IS NOT NULL THEN
    RAISE EXCEPTION 'authenticated executa SECURITY DEFINER fora da allowlist: %', extra;
  END IF;

  SELECT string_agg(w.sig, ', ' ORDER BY w.sig) INTO missing
  FROM _definer_auth w WHERE NOT EXISTS (SELECT 1 FROM _fn f WHERE f.sig = w.sig AND f.auth_exec);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'allowlist declara função(ões) sem EXECUTE para authenticated: %', missing;
  END IF;

  RAISE NOTICE 'OK — anon: 12 RPCs públicas; authenticated: 13 SECURITY DEFINER da allowlist.';
END $$;

ROLLBACK;
