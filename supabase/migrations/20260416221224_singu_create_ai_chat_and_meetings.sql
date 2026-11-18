-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221224
-- nome:   singu_create_ai_chat_and_meetings

-- ============================================================================
-- SINGU — AI CHAT (Ask CRM) + MEETING SUMMARIES + VISIT CHECKINS
-- Specs: features/ask-crm-chat, features/meeting-summary-ai
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  context_type text DEFAULT 'crm_data' CHECK (context_type IN ('crm_data','contact','company','deal','general','custom')),
  context_id uuid,
  model_used text,
  total_messages integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  is_archived boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ai_chat_threads IS 'SINGU: Threads do Ask CRM Chat (IA flutuante para consultar dados em linguagem natural via SQL gerado). Cada thread mantém contexto.';

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system','function','tool')),
  content text NOT NULL,
  -- Para mensagens assistant: query SQL gerada + resultado
  generated_sql text,
  query_result jsonb,
  tokens_used integer,
  latency_ms integer,
  model text,
  tool_calls jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ai_chat_messages IS 'SINGU: Mensagens do Ask CRM Chat. Role user/assistant/system/tool. Mensagens assistant podem carregar generated_sql + query_result para auditoria.';

CREATE TABLE IF NOT EXISTS public.meeting_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  meeting_date timestamp with time zone NOT NULL,
  duration_minutes integer,
  participants jsonb DEFAULT '[]'::jsonb,
  -- Conteúdo gerado pela Edge Function meeting-summary
  summary text NOT NULL,
  decisions jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  next_steps jsonb DEFAULT '[]'::jsonb,
  questions_raised jsonb DEFAULT '[]'::jsonb,
  objections jsonb DEFAULT '[]'::jsonb,
  key_topics text[] DEFAULT '{}'::text[],
  sentiment text CHECK (sentiment IN ('very_positive','positive','neutral','negative','very_negative','mixed')),
  -- Fontes
  transcript text,
  audio_url text,
  video_url text,
  source text DEFAULT 'manual' CHECK (source IN ('manual','gmeet','zoom','teams','recording','whatsapp','phone')),
  interaction_id uuid,
  ai_model text,
  ai_confidence integer CHECK (ai_confidence BETWEEN 0 AND 100),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.meeting_summaries IS 'SINGU: Resumos de reuniões gerados por IA. Edge Function meeting-summary extrai decisões, action items, participantes e next steps de transcript/audio/video.';

CREATE TABLE IF NOT EXISTS public.visit_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  checkin_at timestamp with time zone NOT NULL DEFAULT now(),
  checkout_at timestamp with time zone,
  duration_minutes integer GENERATED ALWAYS AS (
    CASE WHEN checkout_at IS NOT NULL 
         THEN EXTRACT(EPOCH FROM (checkout_at - checkin_at))::integer / 60
         ELSE NULL END
  ) STORED,
  latitude numeric(10,7),
  longitude numeric(10,7),
  address text,
  accuracy_meters numeric(6,2),
  purpose text,
  notes text,
  outcome text CHECK (outcome IN ('successful','rescheduled','no_show','partial','cancelled')),
  photos jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.visit_checkins IS 'SINGU: Check-ins de visitas presenciais com GPS (lat/long/accuracy), duração computada, fotos e outcome. duration_minutes é computed.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_user ON public.ai_chat_threads (user_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_thread ON public.ai_chat_messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_user_date ON public.meeting_summaries (user_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_contact ON public.meeting_summaries (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_company ON public.meeting_summaries (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visit_checkins_user_date ON public.visit_checkins (user_id, checkin_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_checkins_company ON public.visit_checkins (company_id, checkin_at DESC) WHERE company_id IS NOT NULL;

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['ai_chat_threads','ai_chat_messages','meeting_summaries','visit_checkins'])
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
