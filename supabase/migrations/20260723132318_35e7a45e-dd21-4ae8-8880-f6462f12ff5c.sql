
-- 1) Column-level UPDATE grant para incrementar contadores de view
GRANT UPDATE (buyer_view_count, last_buyer_view_at) ON public.deal_rooms TO anon, authenticated;
GRANT SELECT ON public.deal_rooms TO anon;
GRANT SELECT ON public.deal_room_milestones TO anon;
GRANT SELECT ON public.deal_room_stakeholders TO anon;
GRANT SELECT ON public.deal_room_documents TO anon;
GRANT SELECT ON public.deal_room_comments TO anon;
GRANT SELECT ON public.deal_room_activities TO anon;
GRANT INSERT ON public.deal_room_activities TO anon;

-- 2) Policies públicas (share_enabled) — deal_rooms
CREATE POLICY dr_public_read_shared ON public.deal_rooms
  FOR SELECT TO anon, authenticated
  USING (share_enabled = true);

CREATE POLICY dr_public_increment_view ON public.deal_rooms
  FOR UPDATE TO anon, authenticated
  USING (share_enabled = true)
  WITH CHECK (share_enabled = true);

-- 3) Policies públicas em tabelas filhas — SELECT quando sala pai compartilhada
CREATE POLICY drm_public_read_shared ON public.deal_room_milestones
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true));

CREATE POLICY drs_public_read_shared ON public.deal_room_stakeholders
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true));

CREATE POLICY drd_public_read_shared ON public.deal_room_documents
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true));

CREATE POLICY drc_public_read_shared ON public.deal_room_comments
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true));

CREATE POLICY dra_public_read_shared ON public.deal_room_activities
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true));

-- 4) Insert de "buyer view" pelo visitante em salas compartilhadas
CREATE POLICY dra_public_insert_buyer_view ON public.deal_room_activities
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    actor_side = 'buyer'
    AND activity_type = 'view'
    AND EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true AND r.user_id = deal_room_activities.user_id)
  );

-- 5) Converter funções para SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_deal_room_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
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
$function$;

CREATE OR REPLACE FUNCTION public.record_buyer_view(_token text, _label text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
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
$function$;

CREATE OR REPLACE FUNCTION public.get_buyer_document_path(_token text, _document_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _room public.deal_rooms;
  _path TEXT;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN NULL; END IF;

  SELECT file_path INTO _path FROM public.deal_room_documents
  WHERE id = _document_id AND room_id = _room.id;

  RETURN _path;
END;
$function$;
