
CREATE TABLE IF NOT EXISTS public.secret_rotation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_name TEXT NOT NULL,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_by UUID,
  old_hash TEXT,
  new_hash TEXT,
  reason TEXT,
  is_automatic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secret_rotation_name ON public.secret_rotation_log(secret_name, rotated_at DESC);

ALTER TABLE public.secret_rotation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view secret rotation logs"
  ON public.secret_rotation_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert secret rotation logs"
  ON public.secret_rotation_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete secret rotation logs"
  ON public.secret_rotation_log FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
