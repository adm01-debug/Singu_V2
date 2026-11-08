CREATE OR REPLACE FUNCTION public.singu_insert(p_table text, p_user_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  allowed text[];
  result  jsonb;
  cols    text := '';
  vals    text := '';
  k       text;
  v       jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  allowed := get_singu_allowed_tables();
  IF NOT (p_table = ANY(allowed)) THEN
    RAISE EXCEPTION 'Table % not allowed', p_table;
  END IF;

  -- Strip any caller-supplied user_id, then stamp with server-verified identity
  p_data := (p_data - 'user_id') || jsonb_build_object('user_id', auth.uid());

  FOR k, v IN SELECT * FROM jsonb_each(p_data) LOOP
    IF cols != '' THEN cols := cols || ', '; vals := vals || ', '; END IF;
    cols := cols || quote_ident(k);
    IF jsonb_typeof(v) = 'null' THEN
      vals := vals || 'NULL';
    ELSIF jsonb_typeof(v) = 'string' THEN
      vals := vals || quote_literal(v #>> '{}');
    ELSE
      vals := vals || quote_literal(v::text);
    END IF;
  END LOOP;

  EXECUTE format(
    'INSERT INTO public.%I (%s) VALUES (%s) RETURNING row_to_json(%I.*)',
    p_table, cols, vals, p_table
  ) INTO result;

  RETURN result;
END;
$function$
