-- O gate scripts/migration/verify/rls-coverage.sql exige RLS + ao menos uma
-- policy em 100% das tabelas de public. A tabela de nonces e manipulada apenas
-- pela edge function incoming-webhook, que usa service_role; anon e authenticated
-- ja tiveram todos os grants revogados. A policy abaixo torna essa intencao
-- explicita no catalogo, em vez de depender so do BYPASSRLS do service_role.
CREATE POLICY incoming_webhook_nonces_service_only
  ON public.incoming_webhook_nonces
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
