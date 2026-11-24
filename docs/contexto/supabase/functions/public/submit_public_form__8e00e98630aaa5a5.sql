CREATE OR REPLACE FUNCTION public.submit_public_form(_slug text, _data jsonb, _utms jsonb DEFAULT '{}'::jsonb, _page_url text DEFAULT NULL::text, _user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _form public.forms;
  _submission_id UUID;
  _routed UUID;
  _members JSONB;
  _members_count INT;
  _idx INT;
BEGIN
  SELECT * INTO _form FROM public.forms WHERE slug = _slug AND is_published = true LIMIT 1;
  IF _form.id IS NULL THEN
    RAISE EXCEPTION 'Form not found or not published';
  END IF;

  -- Round-robin routing
  _members := COALESCE(_form.routing_rules->'members', '[]'::jsonb);
  _members_count := jsonb_array_length(_members);
  IF _members_count > 0 THEN
    _idx := (_form.submission_count % _members_count);
    _routed := (_members->>_idx)::uuid;
  END IF;

  INSERT INTO public.form_submissions (
    form_id, user_id, data, routed_to,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    page_url, user_agent
  )
  VALUES (
    _form.id, _form.user_id, _data, _routed,
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    _utms->>'utm_content', _utms->>'utm_term',
    _page_url, _user_agent
  )
  RETURNING id INTO _submission_id;

  UPDATE public.forms
    SET submission_count = submission_count + 1
    WHERE id = _form.id;

  -- Touchpoint
  INSERT INTO public.attribution_touchpoints (
    user_id, contact_id, touchpoint_type, source, medium, campaign, content, term, page_url, metadata
  ) VALUES (
    _form.user_id, NULL, 'form',
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    _utms->>'utm_content', _utms->>'utm_term',
    _page_url,
    jsonb_build_object('form_id', _form.id, 'submission_id', _submission_id, 'form_name', _form.name)
  );

  RETURN jsonb_build_object(
    'submission_id', _submission_id,
    'redirect_url', _form.redirect_url,
    'success_message', _form.success_message,
    'routed_to', _routed
  );
END;
$function$
