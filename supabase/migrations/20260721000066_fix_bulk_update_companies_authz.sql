-- Migration: fix_bulk_update_companies_authz (Wave 152)
-- SECURITY FIX: bulk_update_companies is SECURITY DEFINER (runs as postgres,
-- bypasses RLS). The function had no ownership check, allowing any authenticated
-- user to update any company's status/segment/source/user_id — including
-- reassigning company ownership to themselves via the user_id field.
--
-- The companies table UPDATE policy (singu_companies_update) requires
-- auth.uid() = user_id, but SECURITY DEFINER functions run as the function
-- owner (postgres) and bypass row-level security entirely.
--
-- Additional fixes in this version:
--   1. Add caller ownership check before executing bulk UPDATE
--   2. Use quote_ident() for column names in dynamic SQL (defense-in-depth)
--   3. Remove dead code: both branches of IF v_key = 'user_id' were identical
--   4. Validate user_id value is a valid UUID before use
--   5. Disallow user_id field from bulk updates (ownership changes must be
--      explicit, single-company operations with full audit trail)

CREATE OR REPLACE FUNCTION public.bulk_update_companies(
  p_company_ids uuid[],
  p_updates     jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_sql        text;
  v_set_clause text := '';
  v_key        text;
  v_value      text;
  v_count      int;
BEGIN
  -- Reject empty inputs early
  IF p_company_ids IS NULL OR array_length(p_company_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('error', 'No company IDs provided');
  END IF;

  -- Ownership check: caller must own every company in the batch
  -- (replicates the RLS policy that SECURITY DEFINER bypasses)
  IF EXISTS (
    SELECT 1 FROM companies
    WHERE id = ANY(p_company_ids)
      AND user_id IS DISTINCT FROM auth.uid()
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: can only bulk-update your own companies');
  END IF;

  -- Build SET clause from whitelisted fields only
  -- user_id excluded: ownership transfer must go through a dedicated,
  -- audited function, not a bulk operation.
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_updates)
  LOOP
    IF v_key IN ('status', 'segment', 'source') THEN
      IF v_set_clause != '' THEN
        v_set_clause := v_set_clause || ', ';
      END IF;
      -- quote_ident() guards against identifier injection even though the
      -- whitelist already constrains v_key to known-safe names.
      v_set_clause := v_set_clause
        || quote_ident(v_key) || ' = ' || quote_literal(v_value);
    END IF;
  END LOOP;

  IF v_set_clause = '' THEN
    RETURN jsonb_build_object('error', 'No valid fields to update');
  END IF;

  v_set_clause := v_set_clause || ', updated_at = NOW()';
  v_sql := 'UPDATE companies SET ' || v_set_clause
    || ' WHERE id = ANY($1) AND user_id = $2';

  -- Bind both array and caller uid as parameters (never interpolated)
  EXECUTE v_sql USING p_company_ids, auth.uid();
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'updated',   v_count,
    'requested', array_length(p_company_ids, 1)
  );
END;
$$;
