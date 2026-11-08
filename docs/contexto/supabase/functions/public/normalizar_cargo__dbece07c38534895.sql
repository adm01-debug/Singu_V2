CREATE OR REPLACE FUNCTION public.normalizar_cargo(texto text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  palavras   text[];
  resultado  text[];
  palavra    text;
  minusculas text[] := ARRAY[
    'de','da','do','das','dos','e','em','a','o','as','os',
    'no','na','nos','nas','por','para','com','sem','sob',
    'ao','aos','à','às','um','uma','uns','umas'
  ];
  siglas text[] := ARRAY[
    'ceo','cfo','coo','cto','cmo','cpo','ciso',
    'ti','rh','it','bi','erp','crm','sac',
    'rpa','ai','ml','sql','api'
  ];
  i int;
BEGIN
  IF texto IS NULL OR trim(texto) = '' THEN
    RETURN texto;
  END IF;

  -- Normalizar espaços múltiplos
  texto := trim(regexp_replace(texto, '\s+', ' ', 'g'));

  palavras  := string_to_array(lower(texto), ' ');
  resultado := ARRAY[]::text[];

  FOR i IN 1..array_length(palavras, 1) LOOP
    palavra := palavras[i];

    IF palavra = ANY(siglas) THEN
      palavra := upper(palavra);
    ELSIF i = 1 OR NOT (palavra = ANY(minusculas)) THEN
      palavra := upper(left(palavra, 1)) || substring(palavra, 2);
    END IF;

    resultado := array_append(resultado, palavra);
  END LOOP;

  RETURN array_to_string(resultado, ' ');
END;
$function$
