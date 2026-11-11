-- ============================================================================
-- migrations-preamble.sql — fixture de TESTE (não aplicar em Supabase real).
-- Complementa supabase-stubs.sql para conseguir aplicar supabase/migrations/*.sql
-- num Postgres puro e ler o estado FINAL de privilégios/tabelas (ver ddl-migrations.test.mjs).
-- Reproduz o que um projeto Supabase já traz pronto: extensões básicas no schema
-- "extensions", public.* com ACL padrão (anon/authenticated/service_role), storage.foldername,
-- publicação supabase_realtime. Roda DEPOIS de supabase-stubs.sql. Idempotente.
-- ============================================================================
\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Padrão do Supabase: tudo que o postgres cria em public ganha ACL para as 3 roles da API.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
CREATE TABLE IF NOT EXISTS realtime.messages (id bigserial PRIMARY KEY, topic text, extension text, payload jsonb);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('realtime.topic', true) $$;
CREATE OR REPLACE FUNCTION cron.unschedule(job_id bigint) RETURNS boolean LANGUAGE sql AS $$
  WITH d AS (DELETE FROM cron.job WHERE jobid = $1 RETURNING 1) SELECT EXISTS (SELECT 1 FROM d)
$$;
