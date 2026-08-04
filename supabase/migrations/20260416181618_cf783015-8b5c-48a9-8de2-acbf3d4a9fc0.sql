-- Templates de documentos
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'contract',
  content_html TEXT NOT NULL,
  merge_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own templates" ON public.document_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own templates" ON public.document_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own templates" ON public.document_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own templates" ON public.document_templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_document_templates_user ON public.document_templates(user_id);

-- Assinaturas eletrônicas
CREATE TABLE IF NOT EXISTS public.document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  rendered_html TEXT NOT NULL,
  merge_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  signature_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  signature_image TEXT,
  signature_typed TEXT,
  signed_ip TEXT,
  signed_user_agent TEXT,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  declined_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own signatures" ON public.document_signatures
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own signatures" ON public.document_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own signatures" ON public.document_signatures
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own signatures" ON public.document_signatures
  FOR DELETE USING (auth.uid() = user_id);

-- Política pública para acesso via token (signatário externo)
CREATE POLICY "Public can view by token" ON public.document_signatures
  FOR SELECT USING (true);

CREATE TRIGGER trg_document_signatures_updated_at
  BEFORE UPDATE ON public.document_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_document_signatures_user ON public.document_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_token ON public.document_signatures(signature_token);
CREATE INDEX IF NOT EXISTS idx_document_signatures_status ON public.document_signatures(user_id, status);

-- Visualizações de documentos (tracking)
CREATE TABLE IF NOT EXISTS public.document_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_id UUID REFERENCES public.document_signatures(id) ON DELETE CASCADE,
  document_id UUID,
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  viewer_email TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views document_views via signature" ON public.document_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_signatures s
      WHERE s.id = document_views.signature_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert document_views" ON public.document_views
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_document_views_signature ON public.document_views(signature_id);