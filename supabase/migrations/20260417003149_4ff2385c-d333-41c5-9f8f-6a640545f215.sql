
-- ============= TABLES =============

CREATE TABLE public.deal_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deal_id TEXT,
  deal_name TEXT,
  company_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','won','lost','paused')),
  deal_value NUMERIC,
  target_close_date DATE,
  share_token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  share_enabled BOOLEAN NOT NULL DEFAULT false,
  last_buyer_view_at TIMESTAMPTZ,
  buyer_view_count INT NOT NULL DEFAULT 0,
  health_score INT,
  health_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  health_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_user ON public.deal_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_status ON public.deal_rooms(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_company ON public.deal_rooms(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_token ON public.deal_rooms(share_token);

CREATE TABLE public.deal_room_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','blocked')),
  owner_side TEXT NOT NULL DEFAULT 'both' CHECK (owner_side IN ('seller','buyer','both')),
  sort_order INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  completed_by_side TEXT CHECK (completed_by_side IN ('seller','buyer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dr_milestones_room ON public.deal_room_milestones(room_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_dr_milestones_user ON public.deal_room_milestones(user_id);

CREATE TABLE public.deal_room_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  role_title TEXT,
  side TEXT NOT NULL CHECK (side IN ('seller','buyer')),
  influence TEXT NOT NULL DEFAULT 'user' CHECK (influence IN ('champion','decision_maker','influencer','blocker','user')),
  engagement_score INT NOT NULL DEFAULT 50 CHECK (engagement_score BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dr_stakeholders_room ON public.deal_room_stakeholders(room_id);
CREATE INDEX IF NOT EXISTS idx_dr_stakeholders_user ON public.deal_room_stakeholders(user_id);

CREATE TABLE public.deal_room_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by_side TEXT NOT NULL DEFAULT 'seller' CHECK (uploaded_by_side IN ('seller','buyer')),
  view_count INT NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dr_docs_room ON public.deal_room_documents(room_id);
CREATE INDEX IF NOT EXISTS idx_dr_docs_user ON public.deal_room_documents(user_id);

CREATE TABLE public.deal_room_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  actor_side TEXT NOT NULL CHECK (actor_side IN ('seller','buyer','system')),
  actor_label TEXT,
  activity_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dr_activities_room ON public.deal_room_activities(room_id, created_at DESC);

CREATE TABLE public.deal_room_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_side TEXT NOT NULL CHECK (author_side IN ('seller','buyer')),
  author_label TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dr_comments_room ON public.deal_room_comments(room_id, created_at DESC);

-- ============= RLS =============
ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_rooms" ON public.deal_rooms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_ms" ON public.deal_room_milestones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_sh" ON public.deal_room_stakeholders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_docs" ON public.deal_room_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_act" ON public.deal_room_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_all_cmt" ON public.deal_room_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============= TRIGGERS =============
CREATE TRIGGER tr_dr_rooms_updated BEFORE UPDATE ON public.deal_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_dr_ms_updated BEFORE UPDATE ON public.deal_room_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_dr_sh_updated BEFORE UPDATE ON public.deal_room_stakeholders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_dr_rooms_audit AFTER INSERT OR UPDATE OR DELETE ON public.deal_rooms FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
CREATE TRIGGER tr_dr_ms_audit AFTER INSERT OR UPDATE OR DELETE ON public.deal_room_milestones FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ============= RPCs =============

-- Seed/get a deal room for a deal
CREATE OR REPLACE FUNCTION public.seed_deal_room(_user_id UUID, _deal_id TEXT, _deal_name TEXT, _company_id UUID, _title TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT id INTO _id FROM public.deal_rooms
  WHERE user_id = _user_id AND deal_id = _deal_id LIMIT 1;

  IF _id IS NOT NULL THEN
    RETURN _id;
  END IF;

  INSERT INTO public.deal_rooms (user_id, deal_id, deal_name, company_id, title)
  VALUES (_user_id, _deal_id, _deal_name, _company_id, COALESCE(_title, _deal_name, 'Deal Room'))
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

-- Public: get full deal room by share_token
CREATE OR REPLACE FUNCTION public.get_deal_room_by_token(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Public: record a buyer view
CREATE OR REPLACE FUNCTION public.record_buyer_view(_token TEXT, _label TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Public: buyer toggles a milestone (only buyer/both side)
CREATE OR REPLACE FUNCTION public.buyer_toggle_milestone(_token TEXT, _milestone_id UUID, _done BOOLEAN, _label TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Public: buyer adds a comment
CREATE OR REPLACE FUNCTION public.buyer_add_comment(_token TEXT, _body TEXT, _label TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Public: signed URL for a document if token valid
CREATE OR REPLACE FUNCTION public.get_buyer_document_path(_token TEXT, _document_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Grants for anonymous role
GRANT EXECUTE ON FUNCTION public.get_deal_room_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_buyer_view(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_toggle_milestone(TEXT, UUID, BOOLEAN, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buyer_add_comment(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_buyer_document_path(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_deal_room(UUID, TEXT, TEXT, UUID, TEXT) TO authenticated;

-- ============= STORAGE POLICIES =============
-- Bucket 'documents' already exists (private). Path convention: deal-rooms/{room_id}/{filename}
CREATE POLICY "deal_rooms_owner_read_docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'deal-rooms'
  AND EXISTS (
    SELECT 1 FROM public.deal_rooms r
    WHERE r.id::text = (storage.foldername(name))[2]
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY "deal_rooms_owner_write_docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'deal-rooms'
  AND EXISTS (
    SELECT 1 FROM public.deal_rooms r
    WHERE r.id::text = (storage.foldername(name))[2]
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY "deal_rooms_owner_delete_docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'deal-rooms'
  AND EXISTS (
    SELECT 1 FROM public.deal_rooms r
    WHERE r.id::text = (storage.foldername(name))[2]
      AND r.user_id = auth.uid()
  )
);
