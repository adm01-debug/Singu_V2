-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416224009
-- nome:   singu_create_missing_functions_fixed

-- ============================================================================
-- SINGU — 9 FUNCTIONS FALTANTES (ajustado: unaccent/pg_trgm em public no destino)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT extensions.unaccent($1);
$function$;

CREATE OR REPLACE FUNCTION public.auto_reset_leads_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF OLD.leads_today_reset_at IS NULL OR OLD.leads_today_reset_at::date < CURRENT_DATE THEN
    IF NEW.leads_today > OLD.leads_today THEN
      NEW.leads_today := 1;
    ELSE
      NEW.leads_today := 0;
    END IF;
    NEW.leads_today_reset_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result json;
  upper_query text;
BEGIN
  upper_query := upper(trim(query_text));
  IF NOT (upper_query LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  IF upper_query ~ '(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY)\s' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  IF upper_query ~ '(auth\.|pg_|information_schema|supabase_)' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;
  EXECUTE 'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query_text || ') t'
    INTO result;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_team_member_ids(_manager_user_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT array_agg(stm.user_id)
  FROM public.sales_team_members stm
  WHERE stm.manager_id IN (
    SELECT id FROM public.sales_team_members WHERE user_id = _manager_user_id
  )
  OR stm.user_id = _manager_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_lead_counts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  affected integer;
BEGIN
  UPDATE public.sales_team_members
  SET leads_today = 0, leads_today_reset_at = now()
  WHERE leads_today_reset_at IS NULL 
     OR leads_today_reset_at::date < CURRENT_DATE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_companies_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, name text, industry text, city text, state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT c.id, c.name, c.industry, c.city, c.state
  FROM public.companies c
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.industry, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.city, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_contacts_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, role_title text, company_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.role_title, c.company_id
  FROM public.contacts c
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.first_name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(c.last_name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.email, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.role_title, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_interactions_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, title text, type text, created_at timestamp with time zone, contact_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT i.id, i.title, i.type, i.created_at, i.contact_id
  FROM public.interactions i
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(i.title)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(i.content, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  ORDER BY i.created_at DESC
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_products_semantic(p_user_id uuid, p_query text, p_limit integer DEFAULT 20, p_min_similarity real DEFAULT 0.1)
 RETURNS TABLE(id uuid, external_id text, name text, description text, category text, tags text[], image_url text, price numeric, metadata jsonb, similarity real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    p.id, p.external_id, p.name, p.description, p.category,
    p.tags, p.image_url, p.price, p.metadata,
    GREATEST(
      extensions.similarity(public.immutable_unaccent(lower(p.name)), public.immutable_unaccent(lower(p_query))),
      extensions.similarity(public.immutable_unaccent(lower(COALESCE(p.description, ''))), public.immutable_unaccent(lower(p_query))) * 0.7,
      extensions.similarity(public.immutable_unaccent(lower(COALESCE(p.category, ''))), public.immutable_unaccent(lower(p_query))) * 0.5
    )::real AS similarity
  FROM public.search_products_cache p
  WHERE p.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(p.name)) % public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.description, ''))) % public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.category, ''))) % public.immutable_unaccent(lower(p_query))
      OR EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.tags, ARRAY[]::text[])) t
        WHERE public.immutable_unaccent(lower(t)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      )
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$function$;

COMMENT ON FUNCTION public.immutable_unaccent(text) IS 'SINGU: wrapper imutável de unaccent (schema public no destino)';
COMMENT ON FUNCTION public.execute_readonly_query(text) IS 'SINGU: SQL read-only para Ask CRM Chat';
COMMENT ON FUNCTION public.auto_reset_leads_on_update() IS 'SINGU: trigger reset leads_today diário';
COMMENT ON FUNCTION public.get_team_member_ids(uuid) IS 'SINGU: UUIDs de membros da equipe de um manager';
COMMENT ON FUNCTION public.reset_daily_lead_counts() IS 'SINGU: job reset diário contadores';
COMMENT ON FUNCTION public.search_companies_unaccent(uuid,text,integer) IS 'SINGU: busca fuzzy unaccent companies';
COMMENT ON FUNCTION public.search_contacts_unaccent(uuid,text,integer) IS 'SINGU: busca fuzzy unaccent contacts';
COMMENT ON FUNCTION public.search_interactions_unaccent(uuid,text,integer) IS 'SINGU: busca fuzzy unaccent interactions';
COMMENT ON FUNCTION public.search_products_semantic(uuid,text,integer,real) IS 'SINGU: busca semântica pg_trgm em search_products_cache';
