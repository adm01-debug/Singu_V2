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
