CREATE OR REPLACE FUNCTION public.generate_proposal_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'PROP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('proposal_number_seq')::text, 5, '0');
END;
$function$
