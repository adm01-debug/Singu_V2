CREATE OR REPLACE FUNCTION public.merge_contacts(p_keep_contact_id uuid, p_merge_contact_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT result || jsonb_build_object('kept_contact_id', p_keep_contact_id, 'merged_contact_id', p_merge_contact_id,
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0),
    'emails_moved', coalesce((result->'relations_by_table'->>'contact_emails')::integer, 0),
    'phones_moved', coalesce((result->'relations_by_table'->>'contact_phones')::integer, 0))
  FROM (SELECT public.merge_records_atomically('contacts', p_keep_contact_id, p_merge_contact_id, '{}'::jsonb) AS result) AS reply
$function$
