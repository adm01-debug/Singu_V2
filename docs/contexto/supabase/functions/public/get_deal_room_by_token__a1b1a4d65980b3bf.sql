CREATE OR REPLACE FUNCTION public.get_deal_room_by_token(_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _room public.deal_rooms;
  _result JSONB;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'room', jsonb_build_object(
      'id', _room.id,
      'title', _room.title,
      'description', _room.description,
      'deal_name', _room.deal_name,
      'deal_value', _room.deal_value,
      'status', _room.status,
      'target_close_date', _room.target_close_date,
      'created_at', _room.created_at
    ),
    'milestones', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id, 'title', m.title, 'description', m.description,
        'due_date', m.due_date, 'status', m.status, 'owner_side', m.owner_side,
        'sort_order', m.sort_order, 'completed_at', m.completed_at,
        'completed_by_side', m.completed_by_side
      ) ORDER BY m.sort_order)
      FROM public.deal_room_milestones m WHERE m.room_id = _room.id
    ), '[]'::jsonb),
    'stakeholders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'role_title', s.role_title,
        'side', s.side, 'influence', s.influence
      ))
      FROM public.deal_room_stakeholders s WHERE s.room_id = _room.id
    ), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'title', d.title, 'file_path', d.file_path,
        'file_type', d.file_type, 'file_size', d.file_size,
        'uploaded_by_side', d.uploaded_by_side
      ))
      FROM public.deal_room_documents d WHERE d.room_id = _room.id
    ), '[]'::jsonb),
    'comments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'author_side', c.author_side, 'author_label', c.author_label,
        'body', c.body, 'created_at', c.created_at
      ) ORDER BY c.created_at)
      FROM public.deal_room_comments c WHERE c.room_id = _room.id
    ), '[]'::jsonb),
    'activities', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'actor_side', a.actor_side, 'actor_label', a.actor_label,
        'activity_type', a.activity_type, 'payload', a.payload, 'created_at', a.created_at
      ) ORDER BY a.created_at DESC)
      FROM (SELECT * FROM public.deal_room_activities WHERE room_id = _room.id ORDER BY created_at DESC LIMIT 50) a
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$function$
