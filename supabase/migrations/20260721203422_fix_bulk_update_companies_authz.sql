-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721203422
-- nome:   fix_bulk_update_companies_authz

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
  IF p_company_ids IS NULL OR array_length(p_company_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('error', 'No company IDs provided');
  END IF;

  IF EXISTS (
    SELECT 1 FROM companies
    WHERE id = ANY(p_company_ids)
      AND user_id IS DISTINCT FROM auth.uid()
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: can only bulk-update your own companies');
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_updates)
  LOOP
    IF v_key IN ('status', 'segment', 'source') THEN
      IF v_set_clause != '' THEN
        v_set_clause := v_set_clause || ', ';
      END IF;
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

  EXECUTE v_sql USING p_company_ids, auth.uid();
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'updated',   v_count,
    'requested', array_length(p_company_ids, 1)
  );
END;
$$;
