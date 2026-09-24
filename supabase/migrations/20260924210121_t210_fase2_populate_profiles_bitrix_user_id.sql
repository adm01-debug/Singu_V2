-- Popula profiles.bitrix_user_id para quem bate por email (salespeople <-> auth.users <-> public.users/Bitrix).
-- Henrique Silva (Bitrix 17) confirmado por Joaquim em 2026-09-24 como titular de comercial02@ (email diferente).
UPDATE public.profiles p
SET bitrix_user_id = CASE
  WHEN au.email = 'comercial02@promobrindes.com.br' THEN 17  -- Henrique Silva, confirmado (email Bitrix != email login)
  ELSE u.id
END
FROM auth.users au
LEFT JOIN public.users u ON lower(u.email) = lower(au.email)
WHERE p.id = au.id
  AND (u.id IS NOT NULL OR au.email = 'comercial02@promobrindes.com.br');