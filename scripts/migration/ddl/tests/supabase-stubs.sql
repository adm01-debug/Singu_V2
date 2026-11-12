-- ============================================================================
-- supabase-stubs.sql — fixture de TESTE (não aplicar em Supabase real).
-- Cria, num Postgres 16 "puro", o mínimo que a plataforma Supabase já entrega
-- pronto e que scripts/migration/ddl/*.sql e scripts/migration/sql/*.sql
-- pressupõem: roles, schemas auth/extensions/vault/cron/net, auth.uid() & cia,
-- auth.users/auth.identities e stubs das extensões que não existem fora do
-- Supabase (pg_cron, pg_net, supabase_vault).
-- Idempotente: pode rodar mais de uma vez no mesmo banco.
-- Uso: psql -v ON_ERROR_STOP=1 -d <banco_de_teste> -f supabase-stubs.sql
-- ============================================================================
\set ON_ERROR_STOP on

-- Roles são globais do cluster: outro teste pode criá-las em paralelo.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','supabase_admin',
                           'supabase_auth_admin','supabase_storage_admin','authenticator',
                           'dashboard_user'] LOOP
    BEGIN
      -- como no Supabase: service_role e supabase_admin ignoram RLS (só vale se a role for criada aqui)
      EXECUTE format('CREATE ROLE %I NOLOGIN %s', r, CASE WHEN r IN ('service_role', 'supabase_admin') THEN 'BYPASSRLS' ELSE '' END);
    EXCEPTION WHEN duplicate_object OR unique_violation THEN NULL;
    END;
  END LOOP;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS cron;
CREATE SCHEMA IF NOT EXISTS net;
CREATE SCHEMA IF NOT EXISTS graphql;
CREATE SCHEMA IF NOT EXISTS realtime;
GRANT USAGE ON SCHEMA auth, extensions, storage TO anon, authenticated, service_role;

-- No Supabase o search_path do banco inclui "extensions"; o dump depende disso
-- (ex.: gen_random_uuid(), unaccent(), operadores gin_trgm_ops sem qualificar).
DO $$ BEGIN
  EXECUTE format('ALTER DATABASE %I SET search_path = "$user", public, extensions', current_database());
END $$;
SET search_path = "$user", public, extensions;

-- ── auth ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(COALESCE(
    current_setting('request.jwt.claim.sub', true),
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '')::uuid
$$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    current_setting('request.jwt.claims', true)::jsonb ->> 'role')
$$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.email', true),
    current_setting('request.jwt.claims', true)::jsonb ->> 'email')
$$;

CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  banned_until timestamptz,
  deleted_at timestamptz,
  is_anonymous boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_data jsonb,
  provider text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- No Supabase real há sequence serial em auth (refresh_tokens.id) — heal-sequences cobre "auth".
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigserial PRIMARY KEY,
  token text,
  user_id text,
  revoked boolean,
  created_at timestamptz DEFAULT now()
);

-- ── storage (mínimo) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[],
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets(id),
  name text, owner uuid, metadata jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- ── cron (stub de pg_cron) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cron.job (
  jobid bigserial PRIMARY KEY, schedule text NOT NULL, command text NOT NULL,
  nodename text DEFAULT 'localhost', nodeport int DEFAULT 5432,
  database text DEFAULT current_database(), username text DEFAULT current_user,
  active boolean DEFAULT true, jobname text UNIQUE
);
CREATE TABLE IF NOT EXISTS cron.job_run_details (
  jobid bigint, runid bigserial PRIMARY KEY, job_pid int, database text, username text,
  command text, status text, return_message text, start_time timestamptz, end_time timestamptz
);
CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text)
RETURNS bigint LANGUAGE sql AS $$
  INSERT INTO cron.job (jobname, schedule, command) VALUES ($1, $2, $3)
  ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule, command = EXCLUDED.command
  RETURNING jobid
$$;
CREATE OR REPLACE FUNCTION cron.unschedule(job_name text) RETURNS boolean LANGUAGE sql AS $$
  WITH d AS (DELETE FROM cron.job WHERE jobname = $1 RETURNING 1) SELECT EXISTS (SELECT 1 FROM d)
$$;

-- ── net (stub de pg_net) ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION net.http_post(
  url text, body jsonb DEFAULT '{}'::jsonb, params jsonb DEFAULT '{}'::jsonb,
  headers jsonb DEFAULT '{"Content-Type": "application/json"}'::jsonb,
  timeout_milliseconds int DEFAULT 5000
) RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;
CREATE OR REPLACE FUNCTION net.http_get(
  url text, params jsonb DEFAULT '{}'::jsonb, headers jsonb DEFAULT '{}'::jsonb,
  timeout_milliseconds int DEFAULT 5000
) RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;

-- ── vault (stub de supabase_vault) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault.secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE, description text,
  secret text NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE OR REPLACE VIEW vault.decrypted_secrets AS
  SELECT id, name, description, secret, secret AS decrypted_secret, created_at, updated_at FROM vault.secrets;
