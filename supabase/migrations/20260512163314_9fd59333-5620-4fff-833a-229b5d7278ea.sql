-- Adicionar campos de erro e retentativas à fila de sincronização
ALTER TABLE public.social_sync_queue 
ADD COLUMN IF NOT EXISTS error_log TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

-- Criar índice para melhorar performance de busca por status
CREATE INDEX IF NOT EXISTS idx_social_sync_queue_status ON public.social_sync_queue(status);
