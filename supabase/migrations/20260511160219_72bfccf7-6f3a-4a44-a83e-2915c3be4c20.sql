ALTER TABLE public.life_events 
ADD CONSTRAINT life_events_reminder_days_before_check 
CHECK (reminder_days_before >= 0);