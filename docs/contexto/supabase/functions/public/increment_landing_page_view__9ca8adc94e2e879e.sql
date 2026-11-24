CREATE OR REPLACE FUNCTION public.increment_landing_page_view(page_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.landing_pages
  SET view_count = view_count + 1
  WHERE id = page_id
    AND is_published = true;
END;
$function$
