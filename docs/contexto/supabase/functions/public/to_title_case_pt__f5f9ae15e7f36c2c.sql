CREATE OR REPLACE FUNCTION public.to_title_case_pt(s text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  words text[];
  result text[] := '{}';
  w text;
  i integer;
  minors text[] := ARRAY['de','da','do','das','dos','e','em','a','o','no','na','nos','nas','por','para','com','ao','aos','às'];
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  words := regexp_split_to_array(lower(btrim(s)), '\s+');
  FOR i IN 1..COALESCE(array_length(words, 1), 0) LOOP
    w := words[i];
    IF i = 1 OR NOT (w = ANY(minors)) THEN
      w := upper(left(w, 1)) || substr(w, 2);
    END IF;
    result := array_append(result, w);
  END LOOP;
  RETURN array_to_string(result, ' ');
END;
$function$
