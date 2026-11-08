CREATE OR REPLACE FUNCTION public.merge_duplicate_companies(p_keep_id uuid, p_merge_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT result || jsonb_build_object('keep_id', p_keep_id, 'merge_id', p_merge_id,
    'contacts_moved', coalesce((result->'relations_by_table'->>'contacts')::integer, 0),
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0),
    'customers_updated', coalesce((result->'relations_by_table'->>'customers')::integer, 0))
  FROM (SELECT public.merge_records_atomically('companies', p_keep_id, p_merge_id, '{}'::jsonb) AS result) AS reply
$function$
