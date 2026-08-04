-- Function to reset daily lead counts (can be called by cron or manually)
CREATE OR REPLACE FUNCTION public.reset_daily_lead_counts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.sales_team_members
  SET leads_today = 0, leads_today_reset_at = now()
  WHERE leads_today_reset_at IS NULL 
     OR leads_today_reset_at::date < CURRENT_DATE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Trigger function: auto-reset leads_today if date changed before any update
CREATE OR REPLACE FUNCTION public.auto_reset_leads_on_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.leads_today_reset_at IS NULL OR OLD.leads_today_reset_at::date < CURRENT_DATE THEN
    -- If leads_today is being incremented, reset it first then add 1
    IF NEW.leads_today > OLD.leads_today THEN
      NEW.leads_today := 1;
    ELSE
      NEW.leads_today := 0;
    END IF;
    NEW.leads_today_reset_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_auto_reset_leads_daily
BEFORE UPDATE ON public.sales_team_members
FOR EACH ROW
WHEN (OLD.leads_today IS DISTINCT FROM NEW.leads_today)
EXECUTE FUNCTION public.auto_reset_leads_on_update();