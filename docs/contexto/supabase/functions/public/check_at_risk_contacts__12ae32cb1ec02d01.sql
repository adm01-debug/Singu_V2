CREATE OR REPLACE FUNCTION public.check_at_risk_contacts()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Marcar como at_risk se score cair abaixo de 30 ou > 30 dias sem contato (exceto se já lost)
    UPDATE public.contacts
    SET relationship_stage = 'at_risk'
    WHERE relationship_stage NOT IN ('lost', 'at_risk')
    AND (relationship_score < 30 OR days_without_contact > 30);

    -- Gerar notificações/alertas (se a tabela de alertas existir)
    INSERT INTO public.alerts (user_id, contact_id, title, description, type, priority)
    SELECT user_id, id, 'Contato em Risco', 'O contato está sem interação há mais de 30 dias.', 'relationship', 'high'
    FROM public.contacts
    WHERE relationship_stage = 'at_risk'
    AND NOT EXISTS (
        SELECT 1 FROM public.alerts 
        WHERE contact_id = contacts.id 
        AND title = 'Contato em Risco' 
        AND dismissed = false
    );
END;
$function$
