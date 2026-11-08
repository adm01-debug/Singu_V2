CREATE OR REPLACE FUNCTION public.audit_trigger_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  v_new jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
  v_row jsonb := COALESCE(v_new, v_old);
  v_record_id text;
  changed_cols text[];
  col_name text;
BEGIN
  SELECT string_agg(v_row ->> a.attname, ',' ORDER BY array_position(i.indkey, a.attnum))
  INTO v_record_id
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
  WHERE i.indrelid = TG_RELID
    AND i.indisprimary;

  v_record_id := COALESCE(v_record_id, v_row ->> 'id', md5(v_row::text));

  IF TG_OP = 'UPDATE' THEN
    FOR col_name IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_old -> col_name IS DISTINCT FROM v_new -> col_name THEN
        changed_cols := array_append(changed_cols, col_name);
      END IF;
    END LOOP;
  END IF;

  v_old := v_old - ARRAY['access_token', 'refresh_token'];
  v_new := v_new - ARRAY['access_token', 'refresh_token'];

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id)
  VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_old, v_new, changed_cols, (SELECT auth.uid()));

  RETURN COALESCE(NEW, OLD);
END;
$function$
