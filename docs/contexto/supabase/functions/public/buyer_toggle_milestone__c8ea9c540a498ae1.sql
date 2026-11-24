CREATE OR REPLACE FUNCTION public.buyer_toggle_milestone(_token text, _milestone_id uuid, _done boolean, _label text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _room public.deal_rooms;
  _ms public.deal_room_milestones;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN false; END IF;

  SELECT * INTO _ms FROM public.deal_room_milestones WHERE id = _milestone_id AND room_id = _room.id;
  IF _ms.id IS NULL OR _ms.owner_side = 'seller' THEN RETURN false; END IF;

  UPDATE public.deal_room_milestones
  SET status = CASE WHEN _done THEN 'done' ELSE 'pending' END,
      completed_at = CASE WHEN _done THEN now() ELSE NULL END,
      completed_by_side = CASE WHEN _done THEN 'buyer' ELSE NULL END
  WHERE id = _milestone_id;

  INSERT INTO public.deal_room_activities (room_id, user_id, actor_side, actor_label, activity_type, payload)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'),
          CASE WHEN _done THEN 'milestone_completed' ELSE 'milestone_reopened' END,
          jsonb_build_object('milestone_id', _milestone_id, 'title', _ms.title));

  RETURN true;
END;
$function$
