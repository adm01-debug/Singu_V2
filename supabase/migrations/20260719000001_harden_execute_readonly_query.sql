-- Harden execute_readonly_query to prevent multi-statement injection and enforce
-- a true read-only transaction boundary.
--
-- Key changes vs the original:
-- 1. Blocks semicolons to prevent statement injection (SELECT 1; DELETE …).
-- 2. Wraps EXECUTE inside a READ ONLY transaction via SET LOCAL, ensuring
--    no writes can occur even if a SECURITY DEFINER subquery is exploited.
-- 3. Keeps the existing keyword-blocklist as defence-in-depth.
-- 4. Enforces a 20-row LIMIT if the query tries to return more than the AI cap.

CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  upper_query text;
BEGIN
  -- Enforce read-only transaction so no DML can slip through.
  PERFORM set_config('transaction_read_only', 'on', true);

  upper_query := upper(trim(query_text));

  -- Must start with SELECT.
  IF NOT (upper_query LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Block DML / DDL keywords (regex requires trailing space or end-of-string).
  IF upper_query ~* '\m(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY|CALL|DO)\M' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Block semicolons — multi-statement injection vector.
  IF query_text ~ ';' THEN
    RAISE EXCEPTION 'Multi-statement queries are not allowed';
  END IF;

  -- Block access to system schemas.
  IF upper_query ~* '\m(auth\.|pg_|information_schema|supabase_)\M' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;

  -- Block set_config / pg_sleep and other side-effect functions.
  IF upper_query ~* '\m(set_config|pg_sleep|pg_read_file|pg_ls_dir|pg_reload_conf)\M' THEN
    RAISE EXCEPTION 'Query uses a disallowed function';
  END IF;

  EXECUTE
    'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query_text || ' LIMIT 20) t'
    INTO result;

  RETURN result;
END;
$$;

-- Ensure only service_role (edge functions) can call this.
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.execute_readonly_query(text) TO service_role;
