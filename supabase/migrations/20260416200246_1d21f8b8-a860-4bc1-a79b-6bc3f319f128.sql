CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  body text NOT NULL,
  category text,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own SMS templates" ON public.sms_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  message text NOT NULL,
  sender_id text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused','failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  total_recipients integer NOT NULL DEFAULT 0,
  total_sent integer NOT NULL DEFAULT 0,
  total_delivered integer NOT NULL DEFAULT 0,
  total_failed integer NOT NULL DEFAULT 0,
  total_replies integer NOT NULL DEFAULT 0,
  total_opt_outs integer NOT NULL DEFAULT 0,
  cost_estimate_cents integer NOT NULL DEFAULT 0,
  segment_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own SMS campaigns" ON public.sms_campaigns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sms_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sms_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','replied','opted_out')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  replied_at timestamptz,
  cost_cents integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);
ALTER TABLE public.sms_campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View recipients of own SMS campaigns" ON public.sms_campaign_recipients
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.sms_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Insert recipients of own SMS campaigns" ON public.sms_campaign_recipients
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.sms_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Update recipients of own SMS campaigns" ON public.sms_campaign_recipients
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.sms_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));
CREATE POLICY "Delete recipients of own SMS campaigns" ON public.sms_campaign_recipients
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.sms_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));

CREATE TABLE public.sms_opt_outs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  reason text,
  opted_out_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone)
);
ALTER TABLE public.sms_opt_outs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own SMS opt-outs" ON public.sms_opt_outs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_status ON public.sms_campaigns(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_campaign ON public.sms_campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_templates_user ON public.sms_templates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_user_phone ON public.sms_opt_outs(user_id, phone);

CREATE TRIGGER trg_sms_campaigns_updated_at BEFORE UPDATE ON public.sms_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_templates_updated_at BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();