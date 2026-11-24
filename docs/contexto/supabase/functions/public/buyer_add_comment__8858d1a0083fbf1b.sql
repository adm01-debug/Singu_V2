CREATE OR REPLACE FUNCTION public.buyer_add_comment(_token text, _body text, _label text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _room public.deal_rooms;
  _id UUID;
BEGIN
  IF _body IS NULL OR length(trim(_body)) = 0 OR length(_body) > 4000 THEN
    RAISE EXCEPTION 'Invalid comment';
  END IF;

  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.deal_room_comments (room_id, user_id, author_side, author_label, body)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'), _body)
  RETURNING id INTO _id;

  INSERT INTO public.deal_room_activities (room_id, user_id, actor_side, actor_label, activity_type, payload)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'), 'comment', jsonb_build_object('comment_id', _id));

  RETURN _id;
END;
$function$
