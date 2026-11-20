-- [singu-idem] constraint 'life_events_reminder_days_before_check'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'life_events_reminder_days_before_check') THEN
        EXECUTE $sql$ ALTER TABLE public.life_events 
ADD CONSTRAINT life_events_reminder_days_before_check 
CHECK (reminder_days_before >= 0) $sql$;
    END IF;
END $$;