DO $migration$
DECLARE
  v_definition text := pg_get_functiondef('public.merge_records_atomically(text,uuid,uuid,jsonb)'::regprocedure);
  v_anchor constant text := $anchor$  IF v_assignments <> '' THEN$anchor$;
  -- Espaços ECMAScript, em paridade com /\S/ no frontend.
  v_guard constant text := $guard$  IF p_entity = 'companies' AND p_field_overrides ? 'nome_crm'
     AND (jsonb_typeof(p_field_overrides->'nome_crm') IS DISTINCT FROM 'string'
       OR (p_field_overrides->>'nome_crm') !~ U&'[^\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]') THEN
    RAISE EXCEPTION 'Nome principal obrigatório' USING ERRCODE = '22023';
  END IF;
$guard$;
BEGIN
  IF strpos(v_definition, v_guard) > 0 THEN
    RETURN;
  END IF;
  IF length(v_definition) - length(replace(v_definition, v_anchor, '')) <> length(v_anchor) THEN
    RAISE EXCEPTION 'Definição de merge_records_atomically incompatível com o guard de nome';
  END IF;
  EXECUTE replace(v_definition, v_anchor, v_guard || v_anchor);
END;
$migration$;

/* DOWN: usar em outra migration forward-only.
DO $rollback$
DECLARE
  v_definition text := pg_get_functiondef('public.merge_records_atomically(text,uuid,uuid,jsonb)'::regprocedure);
  v_guard constant text := $guard$  IF p_entity = 'companies' AND p_field_overrides ? 'nome_crm'
     AND (jsonb_typeof(p_field_overrides->'nome_crm') IS DISTINCT FROM 'string'
       OR (p_field_overrides->>'nome_crm') !~ U&'[^\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]') THEN
    RAISE EXCEPTION 'Nome principal obrigatório' USING ERRCODE = '22023';
  END IF;
$guard$;
BEGIN
  IF strpos(v_definition, v_guard) = 0 THEN
    RETURN;
  END IF;
  IF length(v_definition) - length(replace(v_definition, v_guard, '')) <> length(v_guard) THEN
    RAISE EXCEPTION 'Guard de nome duplicado em merge_records_atomically';
  END IF;
  EXECUTE replace(v_definition, v_guard, '');
END;
$rollback$;
*/
