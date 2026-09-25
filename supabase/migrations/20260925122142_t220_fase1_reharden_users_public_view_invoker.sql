-- Regressão: t207 (24/09) já havia setado security_invoker=on em public.users_public,
-- mas pg_class.reloptions mostrava security_invoker=off em produção (confirmado 25/09 12:21 UTC).
-- Causa provável: t217 (25/09, "fecha escrita users_public e admin update") recriou a view
-- via CREATE OR REPLACE VIEW sem repetir a opção, o que reseta reloptions no Postgres.
-- Reaplica o fix da etapa 24 do plano banco-único (claude/PLANO_BANCO_UNICO_SINGU_200_ETAPAS.md)
-- sem alterar colunas/lógica da view.
ALTER VIEW public.users_public SET (security_invoker = on);
