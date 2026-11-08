CREATE OR REPLACE FUNCTION public.track_email_click(p_interaction_id uuid, p_link_url text, p_clicked_at timestamp with time zone DEFAULT now())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_interaction_access(p_interaction_id);
  UPDATE interactions 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'email_clicked_at', p_clicked_at,
    'clicked_link', p_link_url
  )
  WHERE id = p_interaction_id;
  
  RETURN FOUND;
END;
$function$
