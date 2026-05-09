
-- Tentar habilitar pg_cron (depende do ambiente Supabase, mas falha silenciosamente se não puder)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar a verificação de saúde dos contatos para rodar diariamente à meia-noite
-- Nota: Isso só funcionará se pg_cron estiver disponível no projeto.
SELECT cron.schedule('check-contact-health-daily', '0 0 * * *', 'SELECT public.check_contact_health_alerts()');

-- Adicionar um comentário para documentar o agendamento
COMMENT ON FUNCTION public.check_contact_health_alerts() IS 'Gera alertas automáticos de CRM baseados em inatividade e risco de churn.';
