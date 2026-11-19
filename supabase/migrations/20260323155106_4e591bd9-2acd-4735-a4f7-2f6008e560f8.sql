
-- Create user roles enum and table
-- app_role existe desde 20260321122851 (salespro batch0). Convergencia com
-- producao (types.ts: 5 valores): cria se ausente, adiciona valores ausentes.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'salesperson', 'moderator', 'user');
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumtypid =
                   (SELECT t.oid FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                    WHERE n.nspname='public' AND t.typname='app_role') AND e.enumlabel='moderator') THEN
      ALTER TYPE public.app_role ADD VALUE 'moderator';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e WHERE e.enumtypid =
                   (SELECT t.oid FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                    WHERE n.nspname='public' AND t.typname='app_role') AND e.enumlabel='user') THEN
      ALTER TYPE public.app_role ADD VALUE 'user';
    END IF;
  END IF;
END $$;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can see all roles, users can see their own
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
