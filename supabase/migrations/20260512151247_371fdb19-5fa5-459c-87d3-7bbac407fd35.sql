-- Adicionar metadados para sugestões de oferta
ALTER TABLE public.offer_suggestions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Tabela para fila de sincronização com retries
CREATE TABLE IF NOT EXISTS public.social_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_log TEXT,
    last_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para log de auditoria psicográfica
CREATE TABLE IF NOT EXISTS public.psychographic_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    change_type TEXT NOT NULL, -- manual, automation, system
    previous_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.social_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychographic_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own social sync queue" 
ON public.social_sync_queue FOR SELECT USING (true);

CREATE POLICY "Users can view psychographic audit logs" 
ON public.psychographic_audit_log FOR SELECT USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_sync_queue_updated_at
    BEFORE UPDATE ON public.social_sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
