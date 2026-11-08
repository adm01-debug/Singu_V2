CREATE OR REPLACE FUNCTION public.get_records_by_period(p_table text, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  query_text text;
BEGIN
  IF p_table NOT IN ('companies', 'contacts', 'customers', 'interactions') THEN
    RETURN jsonb_build_object('error', 'Tabela não suportada');
  END IF;
  
  EXECUTE format('
    SELECT jsonb_build_object(
      ''table'', %L,
      ''periodo'', jsonb_build_object(''inicio'', %L, ''fim'', %L),
      ''total'', (SELECT COUNT(*) FROM %I WHERE created_at::date BETWEEN %L AND %L),
      ''por_dia'', (
        SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia)
        FROM (
          SELECT created_at::date as dia, COUNT(*) as total
          FROM %I
          WHERE created_at::date BETWEEN %L AND %L
          GROUP BY created_at::date
        ) t
      )
    )', p_table, p_start_date, p_end_date, p_table, p_start_date, p_end_date, p_table, p_start_date, p_end_date)
  INTO result;
  
  RETURN result;
END;
$function$
