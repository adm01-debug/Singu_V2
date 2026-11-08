CREATE OR REPLACE FUNCTION public.singu_update(p_table text, p_user_id uuid, p_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  allowed    text[];
  result     jsonb;
  set_clause text := '';
  k          text;
  v          jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  allowed := get_singu_allowed_tables();
  IF NOT (p_table = ANY(allowed)) THEN
    RAISE EXCEPTION 'Table % not allowed', p_table;
  END IF;

  -- Strip protected fields — caller cannot reassign ownership or row identity
  p_data := p_data - 'id' - 'user_id' - 'created_at';

  FOR k, v IN SELECT * FROM jsonb_each(p_data) LOOP
    IF set_clause != '' THEN set_clause := set_clause || ', '; END IF;
    IF jsonb_typeof(v) = 'null' THEN
      set_clause := set_clause || quote_ident(k) || ' = NULL';
    ELSIF jsonb_typeof(v) = 'string' THEN
      set_clause := set_clause || quote_ident(k) || ' = ' || quote_literal(v #>> '{}');
    ELSE
      set_clause := set_clause || quote_ident(k) || ' = ' || quote_literal(v::text);
    END IF;
  END LOOP;

  IF set_clause = '' THEN
    RETURN NULL;
  END IF;

  -- Use parameterized USING — id and uid values never string-interpolated
  EXECUTE format(
    'UPDATE public.%I SET %s WHERE id = $1 AND user_id = $2 RETURNING row_to_json(%I.*)',
    p_table, set_clause, p_table
  ) USING p_id, auth.uid() INTO result;

  RETURN result;
END;
$function$
