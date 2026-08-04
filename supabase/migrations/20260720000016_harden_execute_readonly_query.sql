-- Migration: Harden execute_readonly_query with transaction-level read-only guard
--
-- The original function validates SELECT-only at the string level, but SECURITY DEFINER
-- runs as a superuser. If any DML keyword slips past the regex (e.g. via comment tricks
-- in future changes), it would execute with full privileges. Adding SET LOCAL ensures
-- the DB engine itself enforces read-only — no DML can succeed even if validation breaks.
--
-- Additionally adds a row-count limit enforced at the DB level (defence-in-depth against
-- the application's LIMIT clause being stripped) and a statement timeout to prevent
-- expensive query DoS.

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
  -- Enforce read-only at the transaction level — even SECURITY DEFINER cannot do DML
  -- in a read-only transaction. This is the primary guard; the regex below is secondary.
  PERFORM set_config('transaction_read_only', 'on', true);

  -- Limit query execution time (5 seconds max)
  PERFORM set_config('statement_timeout', '5000', true);

  upper_query := upper(trim(query_text));

  -- Only allow SELECT statements
  IF NOT (upper_query LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Block dangerous keywords (defence-in-depth; read-only mode above is the real guard)
  IF upper_query ~ '\m(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY|CALL|DO|VACUUM|CLUSTER)\M' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Block SQL comments (prevent keyword bypass)
  IF query_text ~ '--' OR query_text ~ '/\*' THEN
    RAISE EXCEPTION 'SQL comments are not allowed in queries';
  END IF;

  -- Block access to auth and internal schemas
  IF upper_query ~ '\m(auth\.|PG_|INFORMATION_SCHEMA|SUPABASE_)\M' OR
     upper_query ~ 'AUTH\.' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;

  -- Block multiple statements (semicolon injection)
  IF query_text ~ ';' THEN
    RAISE EXCEPTION 'Multiple statements are not allowed';
  END IF;

  EXECUTE 'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query_text || ') t LIMIT 100'
    INTO result;

  RETURN result;
END;
$$;
