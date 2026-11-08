-- Migration: fix_singu_user_impersonation (Wave 154)
-- SECURITY FIX: All four singu_* SECURITY DEFINER functions accepted a
-- caller-supplied p_user_id (uuid) and used it directly for data ownership
-- scoping.  Any authenticated user could impersonate another by passing a
-- victim's UUID:
--
--   SELECT singu_query('companies', victim_uuid)          -- read victim's data
--   SELECT singu_insert('contacts', victim_uuid, data)    -- inject as victim
--   SELECT singu_update('companies', victim_uuid, id, {}) -- alter victim's rows
--   SELECT singu_delete('companies', victim_uuid, id)     -- delete victim's rows
--
-- Root cause: SECURITY DEFINER bypasses RLS, so the WHERE user_id = p_user_id
-- clause was the only ownership guard — and the caller controlled it.
--
-- Fix: all four functions now derive the ownership filter from auth.uid()
-- (server-verified JWT claim).  p_user_id is retained in each signature for
-- backward API compatibility but is IGNORED for security decisions.
--
-- Additional fix: search_path changed from 'pg_temp' to 'pg_catalog'.
-- pg_temp in a SECURITY DEFINER function allows a caller to shadow built-in
-- identifiers with temporary objects, enabling type-confusion attacks.

-- ── singu_delete ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.singu_delete(
  p_table   text,
  p_user_id uuid,  -- retained for API compat; IGNORED — auth.uid() used instead
  p_id      uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  allowed      text[];
  rows_deleted integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  allowed := get_singu_allowed_tables();
  IF NOT (p_table = ANY(allowed)) THEN
    RAISE EXCEPTION 'Table % not allowed', p_table;
  END IF;

  -- Use parameterized USING — values never string-interpolated
  EXECUTE format('DELETE FROM public.%I WHERE id = $1 AND user_id = $2', p_table)
    USING p_id, auth.uid();
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  RETURN rows_deleted > 0;
END;
$$;

-- ── singu_insert ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.singu_insert(
  p_table   text,
  p_user_id uuid,  -- retained for API compat; IGNORED — auth.uid() used instead
  p_data    jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
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
$$;

-- ── singu_update ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.singu_update(
  p_table   text,
  p_user_id uuid,  -- retained for API compat; IGNORED — auth.uid() used instead
  p_id      uuid,
  p_data    jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
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
$$;

-- ── singu_query ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.singu_query(
  p_table     text,
  p_user_id   uuid,    -- retained for API compat; IGNORED — auth.uid() used instead
  p_filters   jsonb   DEFAULT '{}'::jsonb,
  p_order_by  text    DEFAULT 'created_at',
  p_order_dir text    DEFAULT 'desc',
  p_limit     integer DEFAULT 50,
  p_offset    integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
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
$$;
