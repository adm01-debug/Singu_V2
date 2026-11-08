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
