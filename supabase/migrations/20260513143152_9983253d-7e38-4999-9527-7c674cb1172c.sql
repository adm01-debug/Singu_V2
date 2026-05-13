CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View para facilitar a leitura de queries lentas por administradores
CREATE OR REPLACE VIEW public.slow_queries_audit AS
SELECT 
    query, 
    calls, 
    total_exec_time / 1000 as total_exec_seconds, 
    mean_exec_time as mean_exec_ms, 
    rows
FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 50;

-- RLS para a view (opcional, dependendo de como é acessada, mas vamos garantir segurança)
GRANT SELECT ON public.slow_queries_audit TO authenticated;
-- Nota: pg_stat_statements por padrão esconde dados de outros usuários se não for superuser, 
-- mas a view facilita o acesso via dashboard admin se o admin tiver permissão.
