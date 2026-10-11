-- Empresa e relações são gravadas na mesma transação, com versão e escopo do dono.
ALTER TABLE public.companies ENABLE TRIGGER companies_increment_version;
ALTER TABLE public.companies ENABLE TRIGGER audit_companies;
CREATE OR REPLACE FUNCTION public.persist_company_composite(
  _id uuid, _record jsonb, _create boolean, _version integer DEFAULT NULL,
  _phones jsonb DEFAULT '[]', _emails jsonb DEFAULT '[]', _addresses jsonb DEFAULT '[]'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor uuid := auth.uid();
  owner_id uuid;
  stored_version integer;
  cols text;
  vals text;
  assignments text;
  relation_table text;
  entries jsonb;
  entry jsonb;
  relation_id uuid;
  affected integer;
  result jsonb;
  creation_recovered boolean := false;
BEGIN
  IF actor IS NULL OR _id IS NULL OR _create IS NULL THEN
    RAISE EXCEPTION 'Autenticação e identificação obrigatórias' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_record) IS DISTINCT FROM 'object'
    OR (_record ? 'user_id' AND (_record->>'user_id') IS DISTINCT FROM actor::text)
    OR _record ? 'id' OR _record ? 'version' THEN
    RAISE EXCEPTION 'Dados inválidos da empresa' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(_phones) IS DISTINCT FROM 'array'
    OR jsonb_typeof(_emails) IS DISTINCT FROM 'array'
    OR jsonb_typeof(_addresses) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Relações devem ser listas' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(_phones) > 100 OR jsonb_array_length(_emails) > 100
    OR jsonb_array_length(_addresses) > 100 THEN
    RAISE EXCEPTION 'Quantidade excessiva de relações' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_id::text, 0));
  SELECT user_id, version INTO owner_id, stored_version
  FROM public.companies WHERE id = _id FOR UPDATE;
  IF FOUND THEN
    IF owner_id IS DISTINCT FROM actor THEN
      RAISE EXCEPTION 'Empresa indisponível' USING ERRCODE = '42501';
    END IF;
    IF _create THEN
      creation_recovered := true;
      SELECT to_jsonb(c) INTO result FROM public.companies c WHERE c.id = _id;
    ELSIF _version IS NULL OR stored_version <> _version THEN
      RAISE EXCEPTION 'CONCURRENT_EDIT entity=companies id=%', _id USING ERRCODE = '40001';
    END IF;
  ELSIF NOT _create THEN
    RAISE EXCEPTION 'Empresa indisponível' USING ERRCODE = '42501';
  END IF;
  IF result IS NULL THEN
    SELECT string_agg(format('%I', k), ', ' ORDER BY k),
      string_agg(format('(q.rec).%I', k), ', ' ORDER BY k),
      string_agg(format('%I = (q.rec).%I', k, k), ', ' ORDER BY k)
    INTO cols, vals, assignments
    FROM jsonb_object_keys(_record) k
    JOIN pg_attribute a ON a.attrelid = 'public.companies'::regclass AND a.attname = k
    WHERE a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '' AND a.attidentity = ''
      AND k NOT IN ('id', 'user_id', 'version', 'created_at', 'updated_at', 'deleted_at', 'deleted_by');
    IF _create THEN
      IF NULLIF(btrim(_record->>'nome_crm'), '') IS NULL THEN
        RAISE EXCEPTION 'Nome da empresa obrigatório' USING ERRCODE = '22023';
      END IF;
      EXECUTE format('INSERT INTO public.companies (id, user_id, %s)
        SELECT $2, $3, %s FROM (SELECT jsonb_populate_record(NULL::public.companies, $1) AS rec) q', cols, vals)
      USING _record, _id, actor;
    ELSE
      EXECUTE format('UPDATE public.companies SET updated_at = now()%s
        FROM (SELECT jsonb_populate_record(NULL::public.companies, $1) AS rec) q
        WHERE id = $2 AND user_id = $3', CASE WHEN assignments IS NULL THEN '' ELSE ', ' || assignments END)
      USING _record, _id, actor;
    END IF;
    FOREACH relation_table IN ARRAY ARRAY['company_phones', 'company_emails', 'company_addresses'] LOOP
      entries := CASE relation_table WHEN 'company_phones' THEN _phones
        WHEN 'company_emails' THEN _emails ELSE _addresses END;
      FOR entry IN SELECT value FROM jsonb_array_elements(entries) LOOP
        IF jsonb_typeof(entry) IS DISTINCT FROM 'object' THEN
          RAISE EXCEPTION 'Relação inválida' USING ERRCODE = '22023';
        END IF;
        relation_id := CASE WHEN _create THEN NULL ELSE (entry->>'id')::uuid END;
        IF relation_id IS NOT NULL THEN
          EXECUTE format('SELECT count(*) FROM public.%I WHERE id = $1 AND company_id = $2', relation_table)
          INTO affected USING relation_id, _id;
          IF affected <> 1 THEN RAISE EXCEPTION 'Relação indisponível' USING ERRCODE = '42501'; END IF;
        END IF;
        IF entry->>'_delete' = 'true' THEN
          IF relation_id IS NULL THEN RAISE EXCEPTION 'Identificação da relação obrigatória' USING ERRCODE = '22023'; END IF;
          EXECUTE format('DELETE FROM public.%I WHERE id = $1 AND company_id = $2', relation_table) USING relation_id, _id;
          CONTINUE;
        END IF;
        IF relation_table = 'company_phones' AND entry ? 'numero'
          AND regexp_replace(COALESCE(entry->>'numero', ''), '[^0-9]', '', 'g') = '' THEN
          RAISE EXCEPTION 'Número de telefone inválido' USING ERRCODE = '22023';
        END IF;
        SELECT string_agg(format('%I', k), ', ' ORDER BY k),
          string_agg(format('(q.rec).%I', k), ', ' ORDER BY k),
          string_agg(format('%I = (q.rec).%I', k, k), ', ' ORDER BY k)
        INTO cols, vals, assignments
        FROM jsonb_object_keys(entry) k
        JOIN pg_attribute a ON a.attrelid = format('public.%I', relation_table)::regclass AND a.attname = k
        WHERE a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '' AND a.attidentity = ''
          AND k NOT IN ('id', 'company_id', 'created_at', 'updated_at');
        IF relation_id IS NULL THEN
          EXECUTE format('INSERT INTO public.%I (company_id%s)
            SELECT $2%s FROM (SELECT jsonb_populate_record(NULL::public.%I, $1) AS rec) q',
            relation_table, CASE WHEN cols IS NULL THEN '' ELSE ', ' || cols END,
            CASE WHEN vals IS NULL THEN '' ELSE ', ' || vals END, relation_table)
          USING entry, _id;
        ELSIF assignments IS NOT NULL THEN
          EXECUTE format('UPDATE public.%I SET %s FROM (SELECT jsonb_populate_record(NULL::public.%I, $1) AS rec) q
            WHERE id = $2 AND company_id = $3', relation_table, assignments, relation_table)
          USING entry, relation_id, _id;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  SELECT to_jsonb(c) || jsonb_build_object(
    '_creation_recovered', creation_recovered,
    'company_phones', COALESCE((SELECT jsonb_agg(p ORDER BY p.id) FROM public.company_phones p WHERE p.company_id = _id), '[]'),
    'company_emails', COALESCE((SELECT jsonb_agg(e ORDER BY e.id) FROM public.company_emails e WHERE e.company_id = _id), '[]'),
    'company_addresses', COALESCE((SELECT jsonb_agg(a ORDER BY a.id) FROM public.company_addresses a WHERE a.company_id = _id), '[]')
  ) INTO result FROM public.companies c WHERE c.id = _id AND c.user_id = actor;
  RETURN result;
END;
$function$;
REVOKE ALL ON FUNCTION public.persist_company_composite(uuid, jsonb, boolean, integer, jsonb, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.persist_company_composite(uuid, jsonb, boolean, integer, jsonb, jsonb, jsonb) TO authenticated;

DO $policies$
DECLARE relation_table text; scope text;
BEGIN
  FOREACH relation_table IN ARRAY ARRAY['company_phones', 'company_emails', 'company_addresses'] LOOP
    scope := format('EXISTS (SELECT 1 FROM public.companies c WHERE c.id = %I.company_id AND c.user_id = (SELECT auth.uid())) OR (SELECT public.has_role(auth.uid(), ''admin''::public.app_role))', relation_table);
    EXECUTE format('DROP POLICY IF EXISTS singu_company_relation_scope ON public.%I', relation_table);
    EXECUTE format('CREATE POLICY singu_company_relation_scope ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', relation_table, scope, scope);
    EXECUTE format('DROP POLICY IF EXISTS singu_company_relation_owner ON public.%I', relation_table);
    EXECUTE format('CREATE POLICY singu_company_relation_owner ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', relation_table, scope, scope);
  END LOOP;
END;
$policies$;

-- DOWN MIGRATION (Rollback): voltar primeiro ao frontend anterior; nenhum dado é removido.
-- DROP FUNCTION IF EXISTS public.persist_company_composite(uuid, jsonb, boolean, integer, jsonb, jsonb, jsonb);
-- DROP POLICY IF EXISTS singu_company_relation_scope ON public.company_phones;
-- DROP POLICY IF EXISTS singu_company_relation_owner ON public.company_phones;
-- DROP POLICY IF EXISTS singu_company_relation_scope ON public.company_emails;
-- DROP POLICY IF EXISTS singu_company_relation_owner ON public.company_emails;
-- DROP POLICY IF EXISTS singu_company_relation_scope ON public.company_addresses;
-- DROP POLICY IF EXISTS singu_company_relation_owner ON public.company_addresses;
-- Remover o escopo restaura as permissões anteriores, inclusive acesso amplo a emails/endereços.
-- Se os gatilhos estavam desativados antes da migration e a reversão for indispensável:
-- ALTER TABLE public.companies DISABLE TRIGGER companies_increment_version;
-- ALTER TABLE public.companies DISABLE TRIGGER audit_companies;
