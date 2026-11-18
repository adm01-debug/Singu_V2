-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417005153
-- nome:   singu_fix_6c_search_drop_recreate

-- DROP functions com signature diferente
DROP FUNCTION IF EXISTS public.search_companies_unaccent(uuid, text, integer);
DROP FUNCTION IF EXISTS public.search_contacts_unaccent(uuid, text, integer);
DROP FUNCTION IF EXISTS public.search_interactions_unaccent(uuid, text, integer);

-- Recriar com trigram
CREATE FUNCTION public.search_companies_unaccent(
  p_user_id uuid, p_query text, p_limit integer DEFAULT 5
)
RETURNS TABLE(id uuid, name text, industry text, city text, state text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS norm_q)
  SELECT c.id, c.name, c.industry, c.city, c.state
  FROM public.companies c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.industry,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.city,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.nome_crm,''))) % q.norm_q
    )
  ORDER BY public.similarity(public.immutable_unaccent(lower(c.name)), q.norm_q) DESC NULLS LAST
  LIMIT p_limit;
$fn$;

CREATE FUNCTION public.search_contacts_unaccent(
  p_user_id uuid, p_query text, p_limit integer DEFAULT 5
)
RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS norm_q)
  SELECT c.id, c.first_name, c.last_name, c.email, c.phone
  FROM public.contacts c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(coalesce(c.first_name,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.last_name,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.email,''))) % q.norm_q
    )
  ORDER BY GREATEST(
      public.similarity(public.immutable_unaccent(lower(coalesce(c.first_name,''))), q.norm_q),
      public.similarity(public.immutable_unaccent(lower(coalesce(c.last_name,''))), q.norm_q)
    ) DESC NULLS LAST
  LIMIT p_limit;
$fn$;

CREATE FUNCTION public.search_interactions_unaccent(
  p_user_id uuid, p_query text, p_limit integer DEFAULT 5
)
RETURNS TABLE(id uuid, title text, content text, type text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS norm_q)
  SELECT i.id, i.title, i.content, i.type, i.created_at
  FROM public.interactions i, q
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(coalesce(i.title,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(i.content,''))) % q.norm_q
    )
  ORDER BY 
    public.similarity(public.immutable_unaccent(lower(coalesce(i.title,''))), q.norm_q) DESC NULLS LAST,
    i.created_at DESC
  LIMIT p_limit;
$fn$;

COMMENT ON FUNCTION public.search_companies_unaccent(uuid,text,integer) IS 'SINGU: busca fuzzy com pg_trgm % operator. Usa indexes GIN trigram funcionais.';
COMMENT ON FUNCTION public.search_contacts_unaccent(uuid,text,integer) IS 'SINGU: busca fuzzy em contacts com pg_trgm.';
COMMENT ON FUNCTION public.search_interactions_unaccent(uuid,text,integer) IS 'SINGU: busca fuzzy em interactions com pg_trgm.';
