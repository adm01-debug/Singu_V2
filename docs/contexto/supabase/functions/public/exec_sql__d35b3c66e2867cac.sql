CREATE OR REPLACE FUNCTION public.exec_sql(query text)
 RETURNS SETOF json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN RETURN QUERY EXECUTE format('SELECT row_to_json(t) FROM (%s) t', query); END; $function$
