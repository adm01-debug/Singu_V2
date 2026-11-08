-- Popula profiles.bitrix_user_id para quem bate por email (salespeople <-> auth.users <-> public.users/Bitrix).
-- Henrique Silva (Bitrix 17) confirmado por Joaquim em 2026-09-24 como titular de comercial02@ (email diferente).
DO $migration$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass('public.profiles')
        AND attname = 'bitrix_user_id'
        AND NOT attisdropped
    )
  THEN
    UPDATE public.profiles p
    SET bitrix_user_id = CASE
      WHEN au.email = 'comercial02@promobrindes.com.br' THEN 17
      ELSE u.id
    END
    FROM auth.users au
    LEFT JOIN public.users u ON lower(u.email) = lower(au.email)
    WHERE p.id = au.id
      AND (u.id IS NOT NULL OR au.email = 'comercial02@promobrindes.com.br');
  END IF;
END;
$migration$;