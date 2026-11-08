CREATE OR REPLACE FUNCTION public.get_contact_disc_profile(p_contact_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'latest_analysis', (
      SELECT row_to_json(d.*) FROM public.disc_analysis_history d
      WHERE d.contact_id = p_contact_id AND d.user_id = p_user_id
      ORDER BY d.analyzed_at DESC LIMIT 1
    ),
    'analysis_count', (
      SELECT COUNT(*) FROM public.disc_analysis_history
      WHERE contact_id = p_contact_id AND user_id = p_user_id
    ),
    'communication_logs_count', (
      SELECT COUNT(*) FROM public.disc_communication_logs
      WHERE contact_id = p_contact_id AND user_id = p_user_id
    )
  ) INTO result;
  RETURN result;
END;
$function$
