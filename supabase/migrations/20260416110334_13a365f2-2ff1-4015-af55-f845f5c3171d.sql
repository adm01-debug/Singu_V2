
CREATE TABLE public.visit_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  notes TEXT,
  photo_url TEXT,
  visit_type TEXT DEFAULT 'presencial' CHECK (visit_type IN ('presencial', 'prospeccao', 'suporte', 'entrega', 'outro')),
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visit_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own visit checkins" ON public.visit_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
