-- Enable realtime for main tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.insights;