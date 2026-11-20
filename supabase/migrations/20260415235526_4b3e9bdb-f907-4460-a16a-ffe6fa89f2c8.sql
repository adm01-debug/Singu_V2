-- [singu-idem] publication 'supabase_realtime' garante 'public.handoff_requests'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname || '.' || tablename = 'public.handoff_requests') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.handoff_requests');
    END IF;
END $$;