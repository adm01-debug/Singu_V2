CREATE OR REPLACE FUNCTION public.check_contact_health_alerts()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 1. Alertas de Inatividade para Prospects/Oportunidades
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'no_contact', 
        'medium',
        'Falta de contato com ' || relationship_stage || ' há ' || EXTRACT(DAY FROM (now() - last_interaction_at)) || ' dias.',
        CASE 
            WHEN relationship_stage = 'prospect' THEN 'Envie um recurso de valor (artigo/ebook) para reaquecer.'
            WHEN relationship_stage = 'qualified_lead' THEN 'Agende uma breve ligação de diagnóstico.'
            WHEN relationship_stage = 'opportunity' THEN 'Apresente um caso de sucesso similar para destravar a decisão.'
            ELSE 'Inicie uma conversa casual para manter o rapport.'
        END
    FROM public.contacts
    WHERE last_interaction_at < now() - interval '15 days'
    AND relationship_stage IN ('prospect', 'qualified_lead', 'opportunity', 'negotiation')
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'no_contact' 
        AND is_resolved = false
    );

    -- 2. Alertas de Risco de Churn (Score Baixo em Clientes)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'at_risk', 
        'high',
        'Alerta de Churn: Score caiu para ' || relationship_score || '.',
        'Agende uma Reunião de Sucesso (QBR) imediatamente para ouvir as dores do cliente.'
    FROM public.contacts
    WHERE relationship_score < 40
    AND relationship_stage IN ('customer', 'loyal_customer')
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'at_risk' 
        AND is_resolved = false
    );

    -- 3. Alertas de Follow-up para Advocates (Manutenção de Promotores)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'follow_up', 
        'low',
        'Mantenha seu Promotor engajado! Sem contato há 30 dias.',
        'Convide-o para um evento exclusivo ou peça um depoimento/indicação.'
    FROM public.contacts
    WHERE last_interaction_at < now() - interval '30 days'
    AND relationship_stage = 'advocate'
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'follow_up' 
        AND is_resolved = false
    );
END;
$function$
