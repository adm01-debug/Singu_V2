CREATE OR REPLACE FUNCTION public.to_title_case_pt(s text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  words  TEXT[];
  result TEXT[] := '{}';
  w      TEXT;
  i      INT;
  minors TEXT[] := ARRAY['de','da','do','das','dos','e','em','a','o','no','na','nos','nas','por','para','com','ao','aos','às'];
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  words := REGEXP_SPLIT_TO_ARRAY(LOWER(TRIM(s)), '\s+');
  FOR i IN 1..ARRAY_LENGTH(words, 1) LOOP
    w := words[i];
    IF i = 1 OR NOT (w = ANY(minors)) THEN
      w := UPPER(LEFT(w, 1)) || RIGHT(w, LENGTH(w) - 1);
    END IF;
    result := ARRAY_APPEND(result, w);
  END LOOP;
  RETURN ARRAY_TO_STRING(result, ' ');
END;
$function$
