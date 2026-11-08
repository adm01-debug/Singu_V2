CREATE OR REPLACE FUNCTION public.get_contact_life_event_gaps(p_contact_id uuid)
 RETURNS TABLE(category text, field_name text, issue_type text, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
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
$function$
