-- 1. Ensure type safety for life events
ALTER TABLE public.life_events 
  DROP CONSTRAINT IF EXISTS life_events_event_type_check;

ALTER TABLE public.life_events 
  ADD CONSTRAINT life_events_event_type_check 
  CHECK (event_type IN ('birthday', 'anniversary', 'promotion', 'travel', 'family', 'achievement', 'other'));

-- 2. Function to auto-increment recurring events
CREATE OR REPLACE FUNCTION public.handle_recurring_life_event()
RETURNS TRIGGER AS $$
BEGIN
    -- If event is recurring and date has passed, we could optionally move it forward,
    -- but usually for CRM we just need to ensure the next year's reminder works.
    -- This trigger can be expanded for more complex logic.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_handle_recurring_life_event ON public.life_events;
CREATE TRIGGER tr_handle_recurring_life_event
BEFORE INSERT OR UPDATE ON public.life_events
FOR EACH ROW EXECUTE FUNCTION public.handle_recurring_life_event();

-- 3. Function to detect Gaps (Life Events)
CREATE OR REPLACE FUNCTION public.get_contact_life_event_gaps(p_contact_id UUID)
RETURNS TABLE (
    category TEXT,
    field_name TEXT,
    issue_type TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY 
    -- Birthday missing
    SELECT 'Eventos'::TEXT, 'Aniversário'::TEXT, 'Não registrado'::TEXT, 'Média'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.life_events WHERE contact_id = p_contact_id AND event_type = 'birthday')
    UNION ALL
    -- No upcoming events in next 90 days
    SELECT 'Relacionamento'::TEXT, 'Frequência de Eventos'::TEXT, 'Sem marcos futuros'::TEXT, 'Baixa'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.life_events WHERE contact_id = p_contact_id AND event_date > now())
    AND EXISTS (SELECT 1 FROM public.contacts WHERE id = p_contact_id);
END;
$$ LANGUAGE plpgsql STABLE;
