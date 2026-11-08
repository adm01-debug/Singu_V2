-- Configurar search_path em TODOS os roles que acessam o banco
ALTER ROLE postgres SET search_path TO public, _dormant, extensions;
ALTER ROLE anon SET search_path TO public, _dormant, extensions;
ALTER ROLE authenticated SET search_path TO public, _dormant, extensions;
ALTER ROLE service_role SET search_path TO public, _dormant, extensions;
ALTER ROLE authenticator SET search_path TO public, _dormant, extensions;
