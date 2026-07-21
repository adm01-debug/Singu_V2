-- Missing user_id indexes on social_* tables that have RLS policies using auth.uid() = user_id.
-- Without these, every authenticated read/write causes a full sequential scan.

CREATE INDEX IF NOT EXISTS idx_social_profiles_user_id
  ON public.social_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_social_life_events_user_id
  ON public.social_life_events(user_id);

CREATE INDEX IF NOT EXISTS idx_social_behavior_analysis_user_id
  ON public.social_behavior_analysis(user_id);

CREATE INDEX IF NOT EXISTS idx_social_scraping_schedule_user_id
  ON public.social_scraping_schedule(user_id);
