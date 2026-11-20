-- [singu-idem] type 'public.error_severity'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'error_severity' AND n.nspname = 'public') THEN
        EXECUTE $sql$ CREATE TYPE public.error_severity AS ENUM ('info', 'warning', 'error', 'critical') $sql$;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    stack TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    severity public.error_severity NOT NULL DEFAULT 'error',
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode INSERIR (para capturar erros de anon/login), mas apenas admins podem ver
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;  -- [singu-idem]
CREATE POLICY "Anyone can insert error logs"
ON public.error_logs
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view error logs" ON public.error_logs;  -- [singu-idem]
CREATE POLICY "Admins can view error logs"
ON public.error_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Index para busca rápida por data e severidade
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);