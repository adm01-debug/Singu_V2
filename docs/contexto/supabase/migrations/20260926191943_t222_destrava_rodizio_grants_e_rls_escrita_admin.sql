-- Nenhuma das 7 RPCs que a tela /rodizio chama direto via supabase.rpc() (rodizioRpc.ts)
-- tinha GRANT EXECUTE para authenticated, e 3 tabelas que elas escrevem só tinham policy de
-- SELECT admin -- zero policy de escrita, nem pra admin. Resultado: nenhum botão da tela
-- funcionava, nem para admin. Fecha GRANT nas RPCs + funções internas que elas chamam, e
-- policy de escrita admin nas tabelas que faltavam (mesmo padrão has_role já usado em
-- customers/contact_phones/company_phones).

GRANT EXECUTE ON FUNCTION public.rodizio_sugerir_distribuicao(integer, jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_aplicar_onda(integer, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_bloquear_cliente(uuid, integer, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_aprovar_bloqueio(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_reverter_execucao(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_closer_executar(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_sdr_executar(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_closer_rotacionar_cliente(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rodizio_sdr_rotacionar_cliente(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_proximo_closer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_proximo_sdr(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_carga_atual_closer(integer) TO authenticated;

CREATE POLICY admin_insert ON public.customer_rotation_state
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY admin_update ON public.customer_rotation_state
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_insert ON public.rodizio_distribuicao_staging
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY admin_update ON public.rodizio_distribuicao_staging
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_insert ON public.rodizio_execucoes
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY admin_update ON public.rodizio_execucoes
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_insert ON public.customer_ownership_history
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY admin_update ON public.customer_ownership_history
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_insert ON public.customer_events
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_insert ON public.customer_sdr_history
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY admin_update ON public.customer_sdr_history
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
