-- Etapa 24: users (espelho Bitrix, com bitrix_data jsonb) tinha SELECT * liberado pra qualquer authenticated
-- via policy read_only_auth (qual = auth.uid() IS NOT NULL, sem filtro de coluna).
-- Confirmado: zero consumidor direto .from('users') no front ou em edge functions do Singu_V2.
CREATE OR REPLACE VIEW public.users_public
WITH (security_invoker = on) AS
SELECT id, name, email, departamento, is_active, is_vendedor
FROM public.users;

GRANT SELECT ON public.users_public TO authenticated;

DROP POLICY IF EXISTS read_only_auth ON public.users;
-- service_full (service_role, ALL) permanece intacta.
