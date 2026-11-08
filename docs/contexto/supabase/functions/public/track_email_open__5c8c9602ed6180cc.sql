CREATE OR REPLACE FUNCTION public.track_email_open(p_interaction_id uuid, p_opened_at timestamp with time zone DEFAULT now())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_interaction_access(p_interaction_id);
  UPDATE interactions 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('email_opened_at', p_opened_at)
  WHERE id = p_interaction_id;
  
  RETURN FOUND;
END;
$function$
