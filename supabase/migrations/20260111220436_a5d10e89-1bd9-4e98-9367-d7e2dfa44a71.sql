-- Enable realtime for main tables
-- [singu-idem] publication 'supabase_realtime' garante 'public.contacts'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = 'public.contacts') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts');
    END IF;
END $$;
-- [singu-idem] publication 'supabase_realtime' garante 'public.companies'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = 'public.companies') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.companies');
    END IF;
END $$;
-- [singu-idem] publication 'supabase_realtime' garante 'public.interactions'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = 'public.interactions') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions');
    END IF;
END $$;
-- [singu-idem] publication 'supabase_realtime' garante 'public.alerts'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = 'public.alerts') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts');
    END IF;
END $$;
-- [singu-idem] publication 'supabase_realtime' garante 'public.health_alerts'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = 'public.health_alerts') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.health_alerts');
    END IF;
END $$;
-- [singu-idem] publication 'supabase_realtime' garante 'public.insights'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = 'public.insights') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.insights');
    END IF;
END $$;