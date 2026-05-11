DROP VIEW IF EXISTS public.v_life_events_audit;

CREATE OR REPLACE VIEW public.v_life_events_audit AS
SELECT 
    h.id,
    h.life_event_id,
    h.contact_id,
    h.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Sistema') as user_name,
    h.event_type,
    h.title,
    h.event_date,
    h.recurring,
    h.reminder_days_before,
    h.change_type,
    h.reason,
    h.changed_at
FROM public.life_events_history h
LEFT JOIN public.profiles p ON h.user_id = p.id
ORDER BY h.changed_at DESC;

GRANT SELECT ON public.v_life_events_audit TO authenticated;
