CREATE OR REPLACE FUNCTION public.increment_form_view(_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.forms SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
END;
$function$
