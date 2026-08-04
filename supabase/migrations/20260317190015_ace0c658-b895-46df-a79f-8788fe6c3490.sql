-- Create immutable unaccent wrapper for use in queries
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT PARALLEL SAFE
SET search_path = public
AS $$
  SELECT extensions.unaccent($1);
$$;