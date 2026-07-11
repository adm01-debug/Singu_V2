-- Rodada P — aplicar security_barrier em views que expõem dados sensíveis
-- Impede que operadores/funções custom vazem linhas por inferência via query plan
ALTER VIEW public.csat_surveys_public          SET (security_barrier = true);
ALTER VIEW public.document_signatures_public   SET (security_barrier = true);
ALTER VIEW public.forms_public                 SET (security_barrier = true);
ALTER VIEW public.landing_pages_public         SET (security_barrier = true);
ALTER VIEW public.push_subscriptions_safe      SET (security_barrier = true);
ALTER VIEW public.slow_queries_audit           SET (security_barrier = true);
ALTER VIEW public.v_contact_behavior_audit     SET (security_barrier = true);
ALTER VIEW public.v_contact_personality_audit  SET (security_barrier = true);
ALTER VIEW public.v_contact_relatives_audit    SET (security_barrier = true);
ALTER VIEW public.v_life_events_audit          SET (security_barrier = true);
ALTER VIEW public.vw_contacts_nlp              SET (security_barrier = true);