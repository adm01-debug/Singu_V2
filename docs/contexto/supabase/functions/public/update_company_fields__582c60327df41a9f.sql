CREATE OR REPLACE FUNCTION public.update_company_fields(p_company_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'pg_temp'
AS $function$
DECLARE
  v_key   text;
  v_value text;
  v_sets  text[] := ARRAY[]::text[];
  v_sql   text;
  v_row   record;
  v_uid   uuid := auth.uid();
BEGIN
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
    IF v_key NOT IN ('id', 'created_at', 'user_id', 'updated_at') THEN
      v_sets := array_append(v_sets, format('%I = %L', v_key, v_value));
    END IF;
  END LOOP;

  IF cardinality(v_sets) = 0 THEN
    RETURN jsonb_build_object('error', 'no valid fields');
  END IF;

  IF v_uid IS NOT NULL THEN
    v_sql := 'UPDATE public.companies SET ' || array_to_string(v_sets, ', ')
          || ', updated_at = now() WHERE id = ' || quote_literal(p_company_id)
          || ' AND user_id = ' || quote_literal(v_uid)
          || ' RETURNING id, nome_fantasia';
  ELSE
    v_sql := 'UPDATE public.companies SET ' || array_to_string(v_sets, ', ')
          || ', updated_at = now() WHERE id = ' || quote_literal(p_company_id)
          || ' RETURNING id, nome_fantasia';
  END IF;

  EXECUTE v_sql INTO v_row;
  IF v_row IS NULL THEN
    RETURN jsonb_build_object('error', 'not found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'nome', v_row.nome_fantasia);
END;
$function$
