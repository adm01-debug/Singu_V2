CREATE OR REPLACE FUNCTION public.record_buyer_view(_token text, _label text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _room public.deal_rooms;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN false; END IF;

  UPDATE public.deal_rooms
  SET buyer_view_count = buyer_view_count + 1,
      last_buyer_view_at = now()
  WHERE id = _room.id;

  INSERT INTO public.deal_room_activities (room_id, user_id, actor_side, actor_label, activity_type, payload)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'), 'view', jsonb_build_object('at', now()));

  RETURN true;
END;
$function$
