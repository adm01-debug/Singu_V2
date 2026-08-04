
CREATE TABLE public.csat_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  score INTEGER CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'in_app', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'answered', 'expired')),
  sent_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.csat_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own csat surveys" ON public.csat_surveys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
