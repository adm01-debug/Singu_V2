
-- Add hierarchy to sales team
ALTER TABLE public.sales_team_members ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.sales_team_members(id) ON DELETE SET NULL;

-- Function to get all team member user_ids under a manager
CREATE OR REPLACE FUNCTION public.get_team_member_ids(_manager_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT array_agg(stm.user_id)
  FROM public.sales_team_members stm
  WHERE stm.manager_id IN (
    SELECT id FROM public.sales_team_members WHERE user_id = _manager_user_id
  )
  OR stm.user_id = _manager_user_id;
$$;
