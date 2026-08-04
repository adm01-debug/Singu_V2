create or replace function public.log_contact_tag_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed boolean := false;
begin
  if coalesce(old.hobbies, '{}') is distinct from coalesce(new.hobbies, '{}') then
    changed := true;
  end if;
  if coalesce(old.interests, '{}') is distinct from coalesce(new.interests, '{}') then
    changed := true;
  end if;
  if changed then
    insert into public.audit_log(entity_type, entity_id, action, old_data, new_data, user_id)
    values (
      'contact_tags',
      new.id,
      'update',
      jsonb_build_object(
        'hobbies', to_jsonb(coalesce(old.hobbies, '{}'::text[])),
        'interests', to_jsonb(coalesce(old.interests, '{}'::text[]))
      ),
      jsonb_build_object(
        'hobbies', to_jsonb(coalesce(new.hobbies, '{}'::text[])),
        'interests', to_jsonb(coalesce(new.interests, '{}'::text[]))
      ),
      coalesce(auth.uid(), new.user_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_contact_tag_changes on public.contacts;

create trigger trg_log_contact_tag_changes
after update of hobbies, interests on public.contacts
for each row execute function public.log_contact_tag_changes();