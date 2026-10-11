-- UP MIGRATION: email obrigatório no perfil, com origem exclusiva em auth.users.
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.profiles'::regclass AND attname = 'email' AND NOT attisdropped) THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
    UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email IS NULL) THEN
      RAISE EXCEPTION 'Há perfis sem email correspondente em auth.users; reconciliar antes da migration';
    END IF;
    ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
  END IF;
END;
$migration$;

-- DOWN MIGRATION (Rollback): só em schema reconstruído onde a coluna foi criada aqui.
-- A reversão reintroduz a incompatibilidade com handle_new_user(); preferir correção adiante.
-- Nunca remover a coluna original do banco canônico.
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
