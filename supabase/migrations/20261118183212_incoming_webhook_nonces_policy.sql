-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20261118183212
-- nome:   incoming_webhook_nonces_policy

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
