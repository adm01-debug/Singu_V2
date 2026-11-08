CREATE OR REPLACE FUNCTION public.title_case_pt(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result TEXT := '';
  word TEXT;
  words TEXT[];
  i INT;
  suffix TEXT;
  base_word TEXT;
BEGIN
  IF input IS NULL OR trim(input) = '' THEN
    RETURN input;
  END IF;

  -- Normaliza "S A" → "S.A." antes de processar
  input := regexp_replace(input, '\bS\s+A\b', 'S.A.', 'g');

  words := regexp_split_to_array(trim(input), '\s+');

  FOR i IN 1..array_length(words, 1) LOOP
    word := words[i];

    -- Verifica se termina com /UF (ex: Toledo/PR)
    IF word ~ '/[A-Za-z]{2}$' THEN
      suffix := substring(word from '/[A-Za-z]{2}$');
      base_word := substring(word from '^[^/]+');
      word := base_word || '/' || upper(substring(suffix from 2));
    END IF;

    -- Preposições/artigos em minúsculo (exceto primeira palavra)
    IF i > 1 AND lower(word) IN ('de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'a', 'o', 'as', 'os', 'para', 'por', 'com', 'sem') THEN
      result := result || ' ' || lower(word);
    ELSE
      -- Sigras conhecidas: LTDA, ME, EPP, EIRELI, CIA, COOP, FOF
      IF word IN ('LTDA', 'ME', 'EPP', 'EIRELI', 'CIA', 'COOP', 'FOF') THEN
        result := result || ' ' || word;
      -- Siglas como S.A. ou S/A
      ELSIF word ~ '^[S][\./]?[A][\.]?$' THEN
        result := result || ' ' || word;
      -- Siglas de estados (UF)
      ELSIF word IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') THEN
        result := result || ' ' || word;
      -- Sigla curta qualquer (1-5 chars, toda maiúscula)
      ELSIF word = upper(word) AND length(word) BETWEEN 1 AND 5 AND word ~ '[A-Z]' THEN
        result := result || ' ' || word;
      -- Hífen (Minas-Brasil)
      ELSIF position('-' in word) > 0 THEN
        result := result || ' ' || public.title_case_pt_aux(word);
      ELSE
        result := result || ' ' || upper(substring(word, 1, 1)) || lower(substring(word, 2));
      END IF;
    END IF;
  END LOOP;

  RETURN trim(result);
END;
$function$
