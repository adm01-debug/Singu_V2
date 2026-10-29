BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated')::text, true);

-- Reproduz a normalização de nome do trigger canônico, inclusive no replay mínimo.
CREATE FUNCTION pg_temp.db01_company_compat() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.nome_crm IS NULL THEN
    NEW.nome_crm := COALESCE(NEW.nome_fantasia, NEW.razao_social, 'Empresa sem nome');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER a_db01_company_compat BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION pg_temp.db01_company_compat();

CREATE FUNCTION pg_temp.db01_snapshot(ids uuid[]) RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object(
    'companies', (SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id) FROM public.companies c WHERE c.id = ANY(ids)),
    'contacts', (SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id) FROM public.contacts c WHERE c.company_id = ANY(ids)),
    'phones', (SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id) FROM public.company_phones p WHERE p.company_id = ANY(ids)),
    'emails', (SELECT jsonb_agg(to_jsonb(e) ORDER BY e.id) FROM public.company_emails e WHERE e.company_id = ANY(ids)),
    'audit', (SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id) FROM public.audit_log a WHERE a.entity_id = ANY(ids))
  );
$$;

SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  owner_id uuid := auth.uid();
  primary_id uuid := gen_random_uuid();
  secondary_id uuid := gen_random_uuid();
  child_id uuid := gen_random_uuid();
  invalid_value jsonb;
  before_state jsonb;
  after_state jsonb;
  result jsonb;
BEGIN
  INSERT INTO public.companies(id, user_id, nome_crm, notes, website) VALUES
    (primary_id, owner_id, 'Empresa preservada', 'Nota original', 'https://example.test'),
    (secondary_id, owner_id, 'Empresa secundária', NULL, NULL);
  INSERT INTO public.contacts(id, user_id, first_name, company_id)
    VALUES (child_id, owner_id, 'Contato vinculado', secondary_id);
  INSERT INTO public.company_emails(company_id, email) VALUES (secondary_id, 'db01@example.test');
  INSERT INTO public.company_phones(company_id, numero, numero_normalizado)
    VALUES (secondary_id, '11 90000-0003', '11900000003');
  before_state := pg_temp.db01_snapshot(ARRAY[primary_id, secondary_id]);

  FOREACH invalid_value IN ARRAY ARRAY[
    'null'::jsonb, '""'::jsonb, '"   "'::jsonb, to_jsonb(E'\t\n\r\f' || chr(11)),
    to_jsonb(U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'::text),
    '17'::jsonb, 'true'::jsonb, '[]'::jsonb, '{}'::jsonb
  ] LOOP
    BEGIN
      PERFORM public.merge_records_atomically('companies', primary_id, secondary_id,
        jsonb_build_object('nome_crm', invalid_value));
      RAISE EXCEPTION 'DB-01: override inválido aceito: %, nome=%, secundária_arquivada=%', invalid_value,
        (SELECT nome_crm FROM public.companies WHERE id = primary_id),
        (SELECT deleted_at IS NOT NULL FROM public.companies WHERE id = secondary_id);
    EXCEPTION WHEN SQLSTATE '22023' THEN
      NULL;
    END;
    IF pg_temp.db01_snapshot(ARRAY[primary_id, secondary_id]) IS DISTINCT FROM before_state THEN
      RAISE EXCEPTION 'DB-01: nome, secundária, relações ou auditoria alterados após rejeição';
    END IF;
  END LOOP;
  RAISE NOTICE 'DB-01: 9 overrides inválidos rejeitados sem alterações';

  result := public.merge_records_atomically('companies', primary_id, secondary_id,
    '{"nome_crm":"  Nome válido  ","notes":null,"website":null}'::jsonb);
  IF result->>'success' IS DISTINCT FROM 'true'
     OR (SELECT nome_crm FROM public.companies WHERE id = primary_id) IS DISTINCT FROM '  Nome válido  '
     OR EXISTS (SELECT 1 FROM public.companies WHERE id = primary_id AND (notes IS NOT NULL OR website IS NOT NULL))
     OR NOT EXISTS (SELECT 1 FROM public.companies WHERE id = secondary_id AND deleted_at IS NOT NULL)
     OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = child_id AND company_id = primary_id)
     OR NOT EXISTS (SELECT 1 FROM public.company_emails WHERE company_id = primary_id AND email = 'db01@example.test')
     OR NOT EXISTS (SELECT 1 FROM public.company_phones WHERE company_id = primary_id AND numero_normalizado = '11900000003')
     OR (SELECT count(*) FROM public.audit_log WHERE entity_id = primary_id AND new_data->>'operation' = 'merge') <> 1 THEN
    RAISE EXCEPTION 'DB-01: nome válido, NULL opcionais ou mesclagem alterados';
  END IF;
  after_state := pg_temp.db01_snapshot(ARRAY[primary_id, secondary_id]);
  result := public.merge_records_atomically('companies', primary_id, secondary_id,
    '{"nome_crm":"  Nome válido  ","notes":null,"website":null}'::jsonb);
  IF result->>'already_merged' IS DISTINCT FROM 'true'
     OR pg_temp.db01_snapshot(ARRAY[primary_id, secondary_id]) IS DISTINCT FROM after_state THEN
    RAISE EXCEPTION 'DB-01: retry deixou de ser idempotente';
  END IF;

  primary_id := gen_random_uuid();
  secondary_id := gen_random_uuid();
  INSERT INTO public.companies(id, user_id, nome_crm, notes) VALUES
    (primary_id, owner_id, 'Nome sem override', 'Nota original'),
    (secondary_id, owner_id, 'Segunda sem override', NULL);
  result := public.merge_records_atomically('companies', primary_id, secondary_id, '{"notes":null}'::jsonb);
  IF result->>'success' IS DISTINCT FROM 'true'
     OR NOT EXISTS (SELECT 1 FROM public.companies WHERE id = primary_id AND nome_crm = 'Nome sem override' AND notes IS NULL) THEN
    RAISE EXCEPTION 'DB-01: chave ausente ou opcional NULL rejeitado';
  END IF;
  RAISE NOTICE 'DB-01: nome válido intacto, NULL opcionais, relações, auditoria, retry e chave ausente aprovados';
END;
$test$;
ROLLBACK;
