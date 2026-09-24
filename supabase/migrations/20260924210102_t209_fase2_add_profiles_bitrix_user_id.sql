-- Etapa 28: ponte Bitrix <-> login.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bitrix_user_id integer REFERENCES public.users(id);
CREATE INDEX IF NOT EXISTS idx_profiles_bitrix_user_id ON public.profiles(bitrix_user_id);