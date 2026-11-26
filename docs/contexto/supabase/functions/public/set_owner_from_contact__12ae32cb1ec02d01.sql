CREATE OR REPLACE FUNCTION public.set_owner_from_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  if new.user_id is null and new.contact_id is not null then
    select c.user_id into new.user_id from public.contacts c where c.id = new.contact_id;
  end if;
  return new;
end $function$
