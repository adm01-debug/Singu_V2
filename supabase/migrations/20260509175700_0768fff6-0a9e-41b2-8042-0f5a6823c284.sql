-- Adicionar suporte a passos de cadência detalhados
ALTER TABLE public.crm_cadence_rules 
ADD COLUMN IF NOT EXISTS cadence_steps JSONB DEFAULT '[]'::jsonb;

-- Criar fila de reprocessamento para automações falhas
CREATE TABLE IF NOT EXISTS public.crm_automation_reprocess_queue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES public.crm_automation_logs(id) ON DELETE CASCADE,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'pending', -- pending, retrying, failed, success
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.crm_automation_reprocess_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reprocess queue" 
ON public.crm_automation_reprocess_queue 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.crm_automation_logs WHERE id = log_id));

-- Adicionar contexto detalhado aos logs de auditoria
ALTER TABLE public.crm_automation_logs 
ADD COLUMN IF NOT EXISTS audit_context JSONB DEFAULT '{}'::jsonb;

-- Função para enfileirar reprocessamento automaticamente em caso de falha (opcional, vamos controlar via UI primeiro)
CREATE OR REPLACE FUNCTION public.enqueue_crm_reprocess()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'error' THEN
        INSERT INTO public.crm_automation_reprocess_queue (log_id, next_retry_at)
        VALUES (NEW.id, now() + interval '5 minutes');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
