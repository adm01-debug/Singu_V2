CREATE OR REPLACE FUNCTION public.paginate_result(p_data jsonb, p_page integer, p_page_size integer, p_total integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'data', p_data,
    'pagination', jsonb_build_object(
      'page', p_page,
      'page_size', p_page_size,
      'total', p_total,
      'total_pages', CEIL(p_total::numeric / p_page_size)::int,
      'has_next', p_page * p_page_size < p_total,
      'has_prev', p_page > 1
    )
  );
END;
$function$
