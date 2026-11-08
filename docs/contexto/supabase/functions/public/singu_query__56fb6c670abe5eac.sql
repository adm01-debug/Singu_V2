CREATE OR REPLACE FUNCTION public.singu_query(p_table text, p_user_id uuid, p_filters jsonb DEFAULT '{}'::jsonb, p_order_by text DEFAULT 'created_at'::text, p_order_dir text DEFAULT 'desc'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  allowed      text[];
  result       jsonb;
  query        text;
  where_clause text := '';
  k            text;
  v            text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  allowed := get_singu_allowed_tables();
  IF NOT (p_table = ANY(allowed)) THEN
    RAISE EXCEPTION 'Table % not allowed', p_table;
  END IF;

  -- Anchor to server-verified caller identity — not the caller-supplied p_user_id
  where_clause := format('user_id = %L', auth.uid());

  FOR k, v IN SELECT * FROM jsonb_each_text(p_filters) LOOP
    where_clause := where_clause || format(' AND %I = %L', k, v);
  END LOOP;

  IF p_order_dir NOT IN ('asc', 'desc') THEN p_order_dir := 'desc'; END IF;

  query := format(
    'SELECT jsonb_agg(row_to_json(t.*)) FROM (SELECT * FROM public.%I WHERE %s ORDER BY %I %s LIMIT %s OFFSET %s) t',
    p_table, where_clause, p_order_by, p_order_dir, p_limit, p_offset
  );

  EXECUTE query INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
