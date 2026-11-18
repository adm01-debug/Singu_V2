-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416232151
-- nome:   singu_create_push_subscriptions_safe_view

-- SINGU: view segura sobre push_subscriptions que expõe só campos não-sensíveis
-- No origem é uma view security-filtered que oculta p256dh e auth (chaves criptográficas)
CREATE OR REPLACE VIEW public.push_subscriptions_safe
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  endpoint,
  created_at
FROM public.push_subscriptions
WHERE user_id = (SELECT auth.uid());

COMMENT ON VIEW public.push_subscriptions_safe IS 'SINGU: view segura de push_subscriptions. Omite chaves criptográficas (p256dh, auth). security_invoker=true respeita RLS do owner da view.';

-- Grant para authenticated ler a view
GRANT SELECT ON public.push_subscriptions_safe TO authenticated;
