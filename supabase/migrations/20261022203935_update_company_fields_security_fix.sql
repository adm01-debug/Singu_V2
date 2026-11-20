-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20261022203935
-- nome:   update_company_fields_security_fix

DO $fnc$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='update_company_fields') THEN
    REVOKE EXECUTE ON FUNCTION public.update_company_fields(p_company_id uuid, p_data jsonb) FROM PUBLIC;
  END IF;
END;
$fnc$;

CREATE OR REPLACE FUNCTION public.update_company_fields(p_company_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
  v_key   text;
  v_value text;
  v_sets  text[] := ARRAY[]::text[];
  v_sql   text;
  v_row   record;
BEGIN
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
    IF v_key NOT IN ('id', 'created_at', 'user_id') THEN
      v_sets := array_append(v_sets, format('%I = %L', v_key, v_value));
    END IF;
  END LOOP;
  IF cardinality(v_sets) = 0 THEN
    RETURN jsonb_build_object('error', 'no valid fields');
  END IF;
  v_sql := 'UPDATE public.companies SET ' || array_to_string(v_sets, ', ')
        || ', updated_at = now() WHERE id = ' || quote_literal(p_company_id)
        || ' AND user_id = ' || quote_literal(auth.uid())
        || ' RETURNING id, nome_fantasia';
  EXECUTE v_sql INTO v_row;
  IF v_row IS NULL THEN
    RETURN jsonb_build_object('error', 'not found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'nome', v_row.nome_fantasia);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_company_fields(uuid, jsonb) TO authenticated, service_role;
