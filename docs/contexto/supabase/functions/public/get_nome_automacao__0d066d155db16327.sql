CREATE OR REPLACE FUNCTION public.get_nome_automacao(p_contact_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE result TEXT;
BEGIN
  SELECT COALESCE(
    apelido,
    nome_tratamento,
    CASE WHEN first_name NOT LIKE '%@%' AND first_name NOT IN ('Sem nome', 'Guest')
      THEN INITCAP(SPLIT_PART(first_name, ' ', 1)) ELSE NULL END,
    'Cliente'
  ) INTO result
  FROM contacts WHERE id = p_contact_id;
  RETURN COALESCE(result, 'Cliente');
END;
$function$
