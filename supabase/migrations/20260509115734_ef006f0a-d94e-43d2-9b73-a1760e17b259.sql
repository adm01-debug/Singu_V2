-- Tabela para transcrições do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_transcriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_message_id UUID NOT NULL REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    provider TEXT DEFAULT 'openai',
    confidence FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_transcriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_transcriptions
CREATE POLICY "Users can view transcriptions of their messages"
    ON public.whatsapp_transcriptions
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.whatsapp_messages m
        WHERE m.id = whatsapp_transcriptions.whatsapp_message_id
        AND m.user_id = auth.uid()
    ));

-- Tabela de Auditoria de Recomendações
CREATE TABLE IF NOT EXISTS public.ai_recommendation_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    score FLOAT NOT NULL,
    recommendation_type TEXT NOT NULL, -- ex: 'next_step', 'daily_briefing'
    reasons TEXT[] NOT NULL DEFAULT '{}',
    data_used JSONB DEFAULT '{}'::jsonb, -- snapshot dos dados no momento da recomendação
    user_action TEXT, -- ex: 'viewed', 'dismissed', 'action_taken'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ai_recommendation_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_recommendation_audit_logs
CREATE POLICY "Users can view their own recommendation audit logs"
    ON public.ai_recommendation_audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation audit logs"
    ON public.ai_recommendation_audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendation audit logs"
    ON public.ai_recommendation_audit_logs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_rec_audit_user_contact ON public.ai_recommendation_audit_logs(user_id, contact_id);
