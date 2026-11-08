CREATE OR REPLACE FUNCTION public.merge_duplicate_contacts(p_keep_id uuid, p_merge_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT result || jsonb_build_object('kept_contact_id', p_keep_id, 'merged_contact_id', p_merge_id,
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0))
  FROM (SELECT public.merge_records_atomically('contacts', p_keep_id, p_merge_id, '{}'::jsonb) AS result) AS reply
$function$
