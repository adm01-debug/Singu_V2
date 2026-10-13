CREATE OR REPLACE FUNCTION public.merge_records_atomically(
  p_entity text,
  p_primary_id uuid,
  p_secondary_id uuid,
  p_field_overrides jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid := auth.uid();
  v_primary record;
  v_secondary record;
  v_field text;
  v_type text;
  v_filter text;
  v_assignments text := '';
  v_columns text := '';
  v_relation record;
  v_scope record;
  v_other_owner boolean;
  v_parent uuid;
  v_parent_owner uuid;
  v_ancestors uuid[];
  v_count integer;
  v_moved integer := 0;
  v_moved_by_table jsonb := '{}'::jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR v_owner IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  IF p_entity IS NULL OR p_entity NOT IN ('contacts', 'companies') OR p_primary_id IS NULL
     OR p_secondary_id IS NULL OR p_primary_id = p_secondary_id THEN
    RAISE EXCEPTION 'Entidade ou identificadores inválidos' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_field_overrides) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Substituições devem ser um objeto' USING ERRCODE = '22023';
  END IF;

  IF p_entity = 'contacts' THEN
    PERFORM 1 FROM public.contacts
    WHERE id IN (p_primary_id, p_secondary_id) ORDER BY id FOR UPDATE;
    SELECT * INTO v_primary FROM public.contacts WHERE id = p_primary_id;
    SELECT * INTO v_secondary FROM public.contacts WHERE id = p_secondary_id;
  ELSE
    PERFORM 1 FROM public.companies
    WHERE id IN (p_primary_id, p_secondary_id) ORDER BY id FOR UPDATE;
    SELECT * INTO v_primary FROM public.companies WHERE id = p_primary_id;
    SELECT * INTO v_secondary FROM public.companies WHERE id = p_secondary_id;
  END IF;
  IF v_primary.id IS NULL OR v_secondary.id IS NULL
     OR v_primary.user_id IS DISTINCT FROM v_owner
     OR v_secondary.user_id IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'Registros inexistentes ou pertencentes a outro usuário' USING ERRCODE = '42501';
  END IF;
  IF v_primary.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Registro principal excluído' USING ERRCODE = '55000';
  END IF;
  IF v_secondary.deleted_at IS NOT NULL THEN
    IF p_entity = 'contacts' THEN
      IF v_secondary.duplicate_of = p_primary_id THEN
        RETURN jsonb_build_object('success', true, 'primary_id', p_primary_id,
          'secondary_id', p_secondary_id, 'already_merged', true);
      END IF;
    ELSIF v_secondary.merge_notes->>'merged_into' = p_primary_id::text THEN
      RETURN jsonb_build_object('success', true, 'primary_id', p_primary_id,
        'secondary_id', p_secondary_id, 'already_merged', true);
    END IF;
    RAISE EXCEPTION 'Registro secundário indisponível' USING ERRCODE = '55000';
  END IF;

  IF p_entity = 'contacts' AND p_field_overrides ? 'company_id'
     AND p_field_overrides->>'company_id' IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.companies
       WHERE id = (p_field_overrides->>'company_id')::uuid
         AND user_id = v_owner AND deleted_at IS NULL
     ) THEN
    RAISE EXCEPTION 'Empresa da substituição indisponível' USING ERRCODE = '42501';
  END IF;
  FOR v_field IN SELECT jsonb_object_keys(p_field_overrides) LOOP
    IF (p_entity = 'contacts' AND v_field NOT IN (
        'first_name', 'last_name', 'email', 'phone', 'role_title', 'company_id',
        'whatsapp', 'linkedin', 'instagram', 'notes', 'family_info'))
       OR (p_entity = 'companies' AND v_field NOT IN (
        'nome_crm', 'cnpj', 'industry', 'website', 'notes', 'tags')) THEN
      RAISE EXCEPTION 'Campo não permitido: %', v_field USING ERRCODE = '22023';
    END IF;
    SELECT a.atttypid::regtype::text INTO v_type
    FROM pg_catalog.pg_attribute AS a
    WHERE a.attrelid = format('public.%I', p_entity)::regclass
      AND a.attname = v_field AND NOT a.attisdropped;
    IF v_type IS NULL THEN
      RAISE EXCEPTION 'Campo não encontrado: %', v_field USING ERRCODE = '42703';
    END IF;
    v_assignments := concat_ws(', ', NULLIF(v_assignments, ''), format('%I = patch.%I', v_field, v_field));
    v_columns := concat_ws(', ', NULLIF(v_columns, ''), format('%I %s', v_field, v_type));
  END LOOP;
  IF v_assignments <> '' THEN
    EXECUTE format('UPDATE public.%I AS target SET %s FROM jsonb_to_record($1) AS patch(%s)
      WHERE target.id = $2 AND target.user_id = $3', p_entity, v_assignments, v_columns)
    USING p_field_overrides, p_primary_id, v_owner;
  END IF;
  IF p_entity = 'contacts' AND EXISTS (
      SELECT 1 FROM public.contacts WHERE id = p_primary_id
        AND NULLIF(btrim(first_name), '') IS NULL
    ) OR p_entity = 'companies' AND EXISTS (
      SELECT 1 FROM public.companies WHERE id = p_primary_id
        AND NULLIF(btrim(nome_crm), '') IS NULL
    ) THEN
    RAISE EXCEPTION 'Nome principal obrigatório' USING ERRCODE = '23514';
  END IF;

  FOR v_relation IN
    SELECT n.nspname, child.relname, attribute.attname,
      attribute.atttypid::regtype::text AS attribute_type,
      EXISTS (SELECT 1 FROM pg_catalog.pg_attribute AS owner_column
        WHERE owner_column.attrelid = child.oid
          AND owner_column.attname = 'user_id' AND owner_column.atttypid = 'uuid'::regtype
          AND NOT owner_column.attisdropped) AS has_owner
    FROM pg_catalog.pg_class AS child
    JOIN pg_catalog.pg_namespace AS n ON n.oid = child.relnamespace
    JOIN pg_catalog.pg_attribute AS attribute
      ON attribute.attrelid = child.oid
    WHERE n.nspname = 'public' AND child.relkind IN ('r', 'p')
      AND child.oid <> format('public.%I', p_entity)::regclass
      AND child.relname <> 'audit_log'
      AND attribute.attnum > 0 AND NOT attribute.attisdropped
      AND (
        attribute.attname = CASE p_entity WHEN 'contacts' THEN 'contact_id' ELSE 'company_id' END
          AND attribute.atttypid = 'uuid'::regtype
        OR EXISTS (
          SELECT 1 FROM pg_catalog.pg_constraint AS constraint_row
          JOIN pg_catalog.pg_attribute AS parent_id
            ON parent_id.attrelid = constraint_row.confrelid
              AND parent_id.attnum = constraint_row.confkey[1] AND parent_id.attname = 'id'
          WHERE constraint_row.contype = 'f' AND cardinality(constraint_row.conkey) = 1
            AND constraint_row.conrelid = child.oid AND constraint_row.conkey[1] = attribute.attnum
            AND constraint_row.confrelid = format('public.%I', p_entity)::regclass
        )
        OR attribute.attname = 'entity_id'
          AND attribute.atttypid IN ('uuid'::regtype, 'text'::regtype)
          AND (EXISTS (SELECT 1 FROM pg_catalog.pg_attribute AS entity_type
            WHERE entity_type.attrelid = child.oid AND entity_type.attname = 'entity_type'
              AND NOT entity_type.attisdropped) OR child.relname = 'custom_field_values')
      )
    ORDER BY n.nspname, child.relname, attribute.attname
  LOOP
    v_filter := CASE WHEN v_relation.attname = 'entity_id' THEN
      CASE WHEN v_relation.relname = 'custom_field_values' THEN
        format(' AND EXISTS (SELECT 1 FROM public.custom_fields AS definition
          WHERE definition.id = child.custom_field_id
            AND definition.entity_type::text IN (%L, %L)
            AND (definition.user_id = %L::uuid OR definition.user_id IS NULL))',
          p_entity, CASE p_entity WHEN 'contacts' THEN 'contact' ELSE 'company' END, v_owner)
      ELSE format(' AND child.entity_type::text IN (%L, %L)', p_entity,
        CASE p_entity WHEN 'contacts' THEN 'contact' ELSE 'company' END) END
      ELSE '' END;
    EXECUTE format('SELECT 1 FROM %I.%I AS child WHERE child.%I = $1::%s %s
      ORDER BY child.ctid FOR UPDATE',
      v_relation.nspname, v_relation.relname, v_relation.attname, v_relation.attribute_type, v_filter)
    USING p_secondary_id;
    IF NOT v_relation.has_owner THEN
      FOR v_scope IN
        SELECT parent_namespace.nspname, parent.relname,
          child_column.attname AS child_column, parent_column.attname AS parent_column
        FROM pg_catalog.pg_constraint AS scope_fk
        JOIN pg_catalog.pg_class AS parent ON parent.oid = scope_fk.confrelid
        JOIN pg_catalog.pg_namespace AS parent_namespace ON parent_namespace.oid = parent.relnamespace
        JOIN pg_catalog.pg_attribute AS child_column
          ON child_column.attrelid = scope_fk.conrelid AND child_column.attnum = scope_fk.conkey[1]
        JOIN pg_catalog.pg_attribute AS parent_column
          ON parent_column.attrelid = scope_fk.confrelid AND parent_column.attnum = scope_fk.confkey[1]
        WHERE scope_fk.contype = 'f' AND cardinality(scope_fk.conkey) = 1
          AND scope_fk.conrelid = format('%I.%I', v_relation.nspname, v_relation.relname)::regclass
          AND EXISTS (SELECT 1 FROM pg_catalog.pg_attribute AS owner_column
            WHERE owner_column.attrelid = scope_fk.confrelid
              AND owner_column.attname = 'user_id' AND owner_column.atttypid = 'uuid'::regtype
              AND NOT owner_column.attisdropped)
      LOOP
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I.%I AS child
          LEFT JOIN %I.%I AS parent ON child.%I = parent.%I
          WHERE child.%I = $1::%s %s AND child.%I IS NOT NULL
            AND parent.user_id IS DISTINCT FROM $2)',
          v_relation.nspname, v_relation.relname, v_scope.nspname, v_scope.relname,
          v_scope.child_column, v_scope.parent_column, v_relation.attname,
          v_relation.attribute_type, v_filter, v_scope.child_column)
        INTO v_other_owner USING p_secondary_id, v_owner;
        IF v_other_owner THEN
          RAISE EXCEPTION 'Vínculo indireto de outro proprietário: %.%',
            v_relation.nspname, v_relation.relname USING ERRCODE = '42501';
        END IF;
      END LOOP;
    ELSE
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I.%I AS child
        WHERE child.%I = $1::%s %s AND child.user_id IS DISTINCT FROM $2)',
        v_relation.nspname, v_relation.relname, v_relation.attname, v_relation.attribute_type, v_filter)
      INTO v_other_owner USING p_secondary_id, v_owner;
      IF v_other_owner THEN
        RAISE EXCEPTION 'Vínculo de outro proprietário: %.%',
          v_relation.nspname, v_relation.relname USING ERRCODE = '42501';
      END IF;
    END IF;
    IF v_relation.has_owner THEN
      EXECUTE format('UPDATE %I.%I AS child SET %I = $1::%s
        WHERE child.%I = $2::%s %s AND child.user_id = $3',
        v_relation.nspname, v_relation.relname, v_relation.attname, v_relation.attribute_type,
        v_relation.attname, v_relation.attribute_type, v_filter)
      USING p_primary_id, p_secondary_id, v_owner;
    ELSE
      EXECUTE format('UPDATE %I.%I AS child SET %I = $1::%s WHERE child.%I = $2::%s %s',
        v_relation.nspname, v_relation.relname, v_relation.attname, v_relation.attribute_type,
        v_relation.attname, v_relation.attribute_type, v_filter)
      USING p_primary_id, p_secondary_id;
    END IF;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_moved := v_moved + v_count;
    v_moved_by_table := v_moved_by_table || jsonb_build_object(v_relation.relname,
      coalesce((v_moved_by_table->>v_relation.relname)::integer, 0) + v_count);
  END LOOP;

  FOR v_relation IN
      SELECT attribute.attname
      FROM pg_catalog.pg_constraint AS constraint_row
      JOIN pg_catalog.pg_attribute AS attribute
        ON attribute.attrelid = constraint_row.conrelid
          AND attribute.attnum = constraint_row.conkey[1]
      WHERE constraint_row.contype = 'f'
        AND cardinality(constraint_row.conkey) = 1
        AND constraint_row.conrelid = format('public.%I', p_entity)::regclass
        AND constraint_row.confrelid = format('public.%I', p_entity)::regclass
      ORDER BY attribute.attname
    LOOP
      v_parent := p_primary_id;
      v_ancestors := '{}'::uuid[];
      WHILE v_parent IS NOT NULL LOOP
        IF v_parent = p_secondary_id OR v_parent = ANY(v_ancestors) THEN
          RAISE EXCEPTION 'Mesclagem criaria relação circular: %',
            v_relation.attname USING ERRCODE = '23514';
        END IF;
        v_ancestors := array_append(v_ancestors, v_parent);
        EXECUTE format('SELECT %I, user_id FROM public.%I WHERE id = $1 FOR UPDATE',
          v_relation.attname, p_entity)
        INTO v_parent, v_parent_owner USING v_parent;
        IF v_parent_owner IS DISTINCT FROM v_owner THEN
          RAISE EXCEPTION 'Ancestral de outro proprietário' USING ERRCODE = '42501';
        END IF;
      END LOOP;
      EXECUTE format('SELECT 1 FROM public.%I WHERE %I = $1 ORDER BY id FOR UPDATE',
        p_entity, v_relation.attname) USING p_secondary_id;
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I
        WHERE %I = $1 AND user_id IS DISTINCT FROM $2)', p_entity, v_relation.attname)
      INTO v_other_owner USING p_secondary_id, v_owner;
      IF v_other_owner THEN
        RAISE EXCEPTION 'Relação pertence a outro usuário' USING ERRCODE = '42501';
      END IF;
      EXECUTE format('UPDATE public.%I SET %I = $1
        WHERE id <> $2 AND %I = $3 AND user_id = $4',
        p_entity, v_relation.attname, v_relation.attname)
      USING p_primary_id, p_secondary_id, p_secondary_id, v_owner;
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_moved := v_moved + v_count;
      v_moved_by_table := v_moved_by_table || jsonb_build_object(p_entity,
        coalesce((v_moved_by_table->>p_entity)::integer, 0) + v_count);
    END LOOP;

  IF p_entity = 'contacts' THEN
    UPDATE public.contacts SET deleted_at = now(), is_duplicate = true, duplicate_of = p_primary_id
    WHERE id = p_secondary_id AND user_id = v_owner;
  ELSE
    UPDATE public.companies SET deleted_at = now(),
      merge_notes = coalesce(merge_notes, '{}'::jsonb) ||
        jsonb_build_object('merged_into', p_primary_id)
    WHERE id = p_secondary_id AND user_id = v_owner;
  END IF;
  INSERT INTO public.audit_log (
    user_id, action, entity_type, entity_id, table_name, record_id, old_data, new_data
  ) VALUES (
    v_owner, 'UPDATE', p_entity, p_primary_id, p_entity, p_primary_id::text,
    jsonb_build_object('merged_from', p_secondary_id, 'primary', to_jsonb(v_primary),
      'secondary', to_jsonb(v_secondary)),
    jsonb_build_object('operation', 'merge', 'overrides', p_field_overrides,
      'relations_moved', v_moved, 'relations_by_table', v_moved_by_table)
  );
  RETURN jsonb_build_object('success', true, 'primary_id', p_primary_id,
    'secondary_id', p_secondary_id, 'relations_moved', v_moved,
    'relations_by_table', v_moved_by_table, 'already_merged', false);
END;
$$;

REVOKE ALL ON FUNCTION public.merge_records_atomically(text, uuid, uuid, jsonb)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.merge_records_atomically(text, uuid, uuid, jsonb)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.merge_companies(p_company_keep uuid, p_company_remove uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT result || jsonb_build_object('company_kept', p_company_keep, 'company_removed', p_company_remove,
    'contacts_moved', coalesce((result->'relations_by_table'->>'contacts')::integer, 0),
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0))
  FROM (SELECT public.merge_records_atomically('companies', p_company_keep, p_company_remove, '{}'::jsonb) AS result) AS reply
$$;

CREATE OR REPLACE FUNCTION public.merge_duplicate_companies(p_keep_id uuid, p_merge_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT result || jsonb_build_object('keep_id', p_keep_id, 'merge_id', p_merge_id,
    'contacts_moved', coalesce((result->'relations_by_table'->>'contacts')::integer, 0),
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0),
    'customers_updated', coalesce((result->'relations_by_table'->>'customers')::integer, 0))
  FROM (SELECT public.merge_records_atomically('companies', p_keep_id, p_merge_id, '{}'::jsonb) AS result) AS reply
$$;

CREATE OR REPLACE FUNCTION public.merge_contacts(p_keep_contact_id uuid, p_merge_contact_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT result || jsonb_build_object('kept_contact_id', p_keep_contact_id, 'merged_contact_id', p_merge_contact_id,
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0),
    'emails_moved', coalesce((result->'relations_by_table'->>'contact_emails')::integer, 0),
    'phones_moved', coalesce((result->'relations_by_table'->>'contact_phones')::integer, 0))
  FROM (SELECT public.merge_records_atomically('contacts', p_keep_contact_id, p_merge_contact_id, '{}'::jsonb) AS result) AS reply
$$;

CREATE OR REPLACE FUNCTION public.merge_duplicate_contacts(p_keep_id uuid, p_merge_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT result || jsonb_build_object('kept_contact_id', p_keep_id, 'merged_contact_id', p_merge_id,
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0))
  FROM (SELECT public.merge_records_atomically('contacts', p_keep_id, p_merge_id, '{}'::jsonb) AS result) AS reply
$$;

REVOKE ALL ON FUNCTION public.merge_companies(uuid, uuid),
  public.merge_duplicate_companies(uuid, uuid),
  public.merge_contacts(uuid, uuid),
  public.merge_duplicate_contacts(uuid, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.merge_companies(uuid, uuid),
  public.merge_duplicate_companies(uuid, uuid),
  public.merge_contacts(uuid, uuid),
  public.merge_duplicate_contacts(uuid, uuid)
  TO authenticated;

-- DOWN: retire os chamadores da nova RPC e restaure as definições anteriores dos
-- quatro aliases a partir das migrations originais antes de remover a RPC.
-- Mesclagens já concluídas exigem reconciliação manual a partir de audit_log.old_data.
-- DROP FUNCTION IF EXISTS public.merge_records_atomically(text, uuid, uuid, jsonb);
