
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
  upper_query := upper(trim(query_text));
  
  -- Only allow SELECT statements
  IF NOT (upper_query LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Block dangerous keywords
  IF upper_query ~ '(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY)\s' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  
  -- Block access to auth and internal schemas
  IF upper_query ~ '(auth\.|pg_|information_schema|supabase_)' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;
  
  EXECUTE 'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query_text || ') t'
    INTO result;
  
  RETURN result;
END;
$$;
