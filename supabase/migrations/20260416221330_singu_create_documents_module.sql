-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221330
-- nome:   singu_create_documents_module

-- ============================================================================
-- SINGU — DOCUMENTS & SIGNATURES (3 tabelas novas, documents já existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text CHECK (category IN ('contract','proposal','nda','quote','invoice','receipt','other')),
  html_template text,
  variables jsonb DEFAULT '[]'::jsonb,
  default_values jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.document_templates IS 'SINGU: Templates reutilizáveis de documentos (contratos, propostas, NDAs) com variáveis substituíveis.';

CREATE TABLE IF NOT EXISTS public.document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid NOT NULL,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signer_phone text,
  signer_role text,
  order_index integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','viewed','signed','rejected','expired','cancelled')),
  signature_method text CHECK (signature_method IN ('click','draw','type','certificate','whatsapp','sms')),
  signature_data text,
  ip_address inet,
  user_agent text,
  location jsonb,
  sent_at timestamp with time zone,
  viewed_at timestamp with time zone,
  signed_at timestamp with time zone,
  rejected_at timestamp with time zone,
  rejection_reason text,
  expires_at timestamp with time zone,
  verification_code text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.document_signatures IS 'SINGU: Assinaturas eletrônicas de documentos com multi-signer, ordering, tracking completo (IP, device, location) e métodos variados.';

CREATE TABLE IF NOT EXISTS public.document_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid NOT NULL,
  viewer_email text,
  viewer_name text,
  ip_address inet,
  user_agent text,
  country text,
  city text,
  session_duration_seconds integer,
  pages_viewed integer[] DEFAULT '{}'::integer[],
  download_count integer DEFAULT 0,
  referer text,
  is_signer boolean DEFAULT false,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
COMMENT ON TABLE public.document_views IS 'SINGU: Rastreamento granular de visualizações de documentos (páginas vistas, duração, downloads, geo).';

CREATE INDEX IF NOT EXISTS idx_doc_templates_user_active ON public.document_templates (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_doc_signatures_doc ON public.document_signatures (document_id, order_index);
CREATE INDEX IF NOT EXISTS idx_doc_signatures_pending ON public.document_signatures (signer_email, status) WHERE status IN ('pending','sent','viewed');
CREATE INDEX IF NOT EXISTS idx_doc_views_doc ON public.document_views (document_id, viewed_at DESC);

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['document_templates','document_signatures','document_views'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Users can view own" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can insert own" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can update own" ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can delete own" ON public.%I FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "service_role_full" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='updated_at') THEN
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END IF;
  END LOOP;
END $$;
