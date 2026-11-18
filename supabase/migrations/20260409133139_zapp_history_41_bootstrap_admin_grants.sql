-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133139
-- nome:   zapp_history_41_bootstrap_admin_grants

ALTER TABLE zapp_history.admin_grants ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

INSERT INTO zapp_history.admin_grants (user_id, note, source)
SELECT
  p.id,
  'Bootstrap automático em ' || NOW()::date::text || ' — profile ativo do SINGU',
  'bootstrap'
FROM public.profiles p
WHERE p.is_active = TRUE
  AND NOT EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = p.id)
ON CONFLICT DO NOTHING;

-- Reporta quantos foram concedidos
SELECT COUNT(*)::text AS admins_granted FROM zapp_history.admin_grants;
