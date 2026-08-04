-- Ensure pg_cron is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule smart-notify every 4 hours
-- Replace the URL with the actual project URL (hjhthvzwtvwgdrochcam)
SELECT cron.schedule(
  'smart-notify-automation',
  '0 */4 * * *',
  $$ SELECT net.http_post(
    url := 'https://hjhthvzwtvwgdrochcam.supabase.co/functions/v1/smart-notify',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);

-- Ensure notification_logs exists (it was created in a previous migration but just in case)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id TEXT NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'whatsapp' | 'email'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(reminder_id, channel)
);
