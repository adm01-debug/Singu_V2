CREATE OR REPLACE FUNCTION public.track_magnet_download(_slug text, _email text, _name text DEFAULT NULL::text, _utms jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _magnet public.lead_magnets;
  _dl_id uuid;
  _normalized_email text;
  _normalized_name text;
  _safe_utms jsonb;
BEGIN
  IF _slug IS NULL OR length(btrim(_slug)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid magnet slug' USING ERRCODE = '22023';
  END IF;
  IF _utms IS NOT NULL AND (
    jsonb_typeof(_utms) IS DISTINCT FROM 'object'
    OR pg_column_size(_utms) > 16384
  ) THEN
    RAISE EXCEPTION 'Invalid UTM payload' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _magnet
  FROM public.lead_magnets
  WHERE slug = btrim(_slug) AND is_published = true
  LIMIT 1;
  IF _magnet.id IS NULL THEN
    RAISE EXCEPTION 'Magnet not found';
  END IF;

  _normalized_email := NULLIF(lower(btrim(_email)), '');
  _normalized_name := NULLIF(btrim(_name), '');
  IF COALESCE(_magnet.gated, true) AND _normalized_email IS NULL THEN
    RAISE EXCEPTION 'Email is required for gated content' USING ERRCODE = '22023';
  END IF;
  IF _normalized_email IS NOT NULL AND (
    length(_normalized_email) > 320
    OR _normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) THEN
    RAISE EXCEPTION 'Invalid email address' USING ERRCODE = '22023';
  END IF;
  IF _normalized_name IS NOT NULL AND length(_normalized_name) > 200 THEN
    RAISE EXCEPTION 'Name is too long' USING ERRCODE = '22023';
  END IF;

  _safe_utms := COALESCE(_utms, '{}'::jsonb);

  INSERT INTO public.lead_magnet_downloads (
    magnet_id, user_id, email, name,
    utm_source, utm_medium, utm_campaign
  ) VALUES (
    _magnet.id, _magnet.user_id, _normalized_email, _normalized_name,
    left(_safe_utms->>'utm_source', 500),
    left(_safe_utms->>'utm_medium', 500),
    left(_safe_utms->>'utm_campaign', 500)
  ) RETURNING id INTO _dl_id;

  UPDATE public.lead_magnets
  SET download_count = download_count + 1
  WHERE id = _magnet.id;

  INSERT INTO public.attribution_touchpoints (
    user_id, touchpoint_type, source, medium, campaign, metadata
  ) VALUES (
    _magnet.user_id, 'magnet',
    left(_safe_utms->>'utm_source', 500),
    left(_safe_utms->>'utm_medium', 500),
    left(_safe_utms->>'utm_campaign', 500),
    jsonb_build_object(
      'magnet_id', _magnet.id,
      'download_id', _dl_id,
      'title', _magnet.title,
      'email', _normalized_email
    )
  );

  RETURN jsonb_build_object(
    'download_id', _dl_id,
    'file_path', _magnet.file_path,
    'external_url', _magnet.external_url
  );
END;
$function$
