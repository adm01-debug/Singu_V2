CREATE OR REPLACE FUNCTION public.update_contact_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', concat_ws(' ',
      NEW.first_name, NEW.last_name, NEW.nome_tratamento, NEW.apelido,
      NEW.assinatura_contato, NEW.role_title, NEW.cargo, NEW.departamento
    )), 'A')
    || setweight(to_tsvector('simple', concat_ws(' ',
      NEW.email, NEW.phone, NEW.whatsapp, NEW.linkedin, NEW.instagram,
      NEW.twitter, NEW.tags::text, NEW.tags_array::text
    )), 'B');
  RETURN NEW;
END;
$function$
