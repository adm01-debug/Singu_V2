CREATE OR REPLACE FUNCTION public.track_magnet_download(_slug text, _email text, _name text DEFAULT NULL::text, _utms jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _magnet public.lead_magnets;
  _dl_id UUID;
BEGIN
  SELECT * INTO _magnet FROM public.lead_magnets WHERE slug = _slug AND is_published = true LIMIT 1;
  IF _magnet.id IS NULL THEN
    RAISE EXCEPTION 'Magnet not found';
  END IF;

  INSERT INTO public.lead_magnet_downloads (
    magnet_id, user_id, email, name,
    utm_source, utm_medium, utm_campaign
  ) VALUES (
    _magnet.id, _magnet.user_id, _email, _name,
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign'
  ) RETURNING id INTO _dl_id;

  UPDATE public.lead_magnets SET download_count = download_count + 1 WHERE id = _magnet.id;

  INSERT INTO public.attribution_touchpoints (
    user_id, touchpoint_type, source, medium, campaign, metadata
  ) VALUES (
    _magnet.user_id, 'magnet',
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    jsonb_build_object('magnet_id', _magnet.id, 'download_id', _dl_id, 'title', _magnet.title, 'email', _email)
  );

  RETURN jsonb_build_object(
    'download_id', _dl_id,
    'file_path', _magnet.file_path,
    'external_url', _magnet.external_url
  );
END;
$function$
