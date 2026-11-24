-- Stubs legados de ciclo de vida do cliente. São SECURITY DEFINER e não checam papel no corpo:
-- com EXECUTE para `authenticated`, qualquer usuário logado ativava/inativava cliente,
-- registrava compra, qualificava SDR e transferia carteira direto pela API REST.
-- `anon` perdeu o grant em 20261121154000_revoke_anon_exec_stubs_crm.sql; aqui perde também
-- `authenticated`. Nenhuma tela, edge function ou tipo gerado do frontend invoca estas funções.
--
-- Único consumidor interno: o trigger trg_customer_purchases_after_insert
-- (public.trg_after_purchase, SECURITY INVOKER) chama public.ativar_cliente. Ele continua
-- funcionando para `postgres` e `service_role`, que mantêm o EXECUTE; `authenticated` não
-- alcança esse caminho porque customer_purchases só tem policy de SELECT (admin).

REVOKE EXECUTE ON FUNCTION public.ativar_cliente(uuid, integer, text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.inativar_cliente(uuid, text, integer, text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_compra(uuid, numeric, text, text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.sdr_qualificar_cliente(uuid, integer, integer, text, text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.transferir_cliente(uuid, integer, text, integer, text) FROM PUBLIC, authenticated;
