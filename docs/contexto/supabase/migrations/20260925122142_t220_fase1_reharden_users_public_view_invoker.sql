-- Regressão: t207 (24/09) já havia setado security_invoker=on em public.users_public,
-- mas o reloption está OFF em produção agora (confirmado via pg_class.reloptions).
-- Causa provável: t217 (25/09, "fecha escrita users_public e admin update") recriou a view
-- via CREATE OR REPLACE VIEW sem repetir a opção, o que reseta reloptions.
-- Reaplica o fix da etapa 24 do plano banco-único (sem alterar colunas/lógica da view).
ALTER VIEW public.users_public SET (security_invoker = on);
