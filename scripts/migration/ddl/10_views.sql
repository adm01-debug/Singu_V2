-- Generated 2026-07-21T16:17:01Z

CREATE OR REPLACE VIEW public.csat_surveys_public WITH (security_invoker=on) AS 
 SELECT id,
    public_token,
    channel,
    status,
    score,
    sent_at,
    expires_at
   FROM csat_surveys
  WHERE public_token IS NOT NULL AND (expires_at IS NULL OR expires_at > now());
CREATE OR REPLACE VIEW public.document_signatures_public WITH (security_invoker=on) AS 
 SELECT id,
    signature_token,
    signer_name,
    signer_email,
    rendered_html,
    status,
    viewed_at,
    signed_at,
    expires_at
   FROM document_signatures
  WHERE signature_token IS NOT NULL AND (status <> ALL (ARRAY['declined'::text, 'expired'::text])) AND (expires_at IS NULL OR expires_at > now());
CREATE OR REPLACE VIEW public.forms_public WITH (security_invoker=on) AS 
 SELECT id,
    slug,
    name,
    description,
    fields,
    redirect_url,
    success_message
   FROM forms
  WHERE is_published = true;
CREATE OR REPLACE VIEW public.landing_pages_public WITH (security_invoker=on) AS 
 SELECT id,
    slug,
    title,
    description,
    blocks,
    theme,
    redirect_url
   FROM landing_pages
  WHERE is_published = true;
CREATE OR REPLACE VIEW public.push_subscriptions_safe WITH (security_invoker=on) AS 
 SELECT id,
    user_id,
    endpoint,
    created_at
   FROM push_subscriptions;
CREATE OR REPLACE VIEW public.slow_queries_audit WITH (security_invoker=on) AS 
 SELECT query,
    calls,
    total_exec_time / 1000::double precision AS total_exec_seconds,
    mean_exec_time AS mean_exec_ms,
    rows
   FROM extensions.pg_stat_statements
  ORDER BY total_exec_time DESC
 LIMIT 50;
CREATE OR REPLACE VIEW public.v_contact_behavior_audit WITH (security_invoker=on) AS 
 SELECT vak_analysis_history.id,
    vak_analysis_history.contact_id,
    vak_analysis_history.user_id,
    'vak'::text AS analysis_type,
    vak_analysis_history.created_at AS "timestamp",
    vak_analysis_history.analyzed_text,
    vak_analysis_history.is_validated,
    vak_analysis_history.user_feedback
   FROM vak_analysis_history
UNION ALL
 SELECT metaprogram_analysis.id,
    metaprogram_analysis.contact_id,
    metaprogram_analysis.user_id,
    'metaprogram'::text AS analysis_type,
    metaprogram_analysis.created_at AS "timestamp",
    metaprogram_analysis.analyzed_text,
    metaprogram_analysis.is_validated,
    metaprogram_analysis.user_feedback
   FROM metaprogram_analysis;
CREATE OR REPLACE VIEW public.v_contact_personality_audit WITH (security_invoker=on) AS 
 SELECT l.id,
    l.contact_id,
    l.created_at AS "timestamp",
    (p.first_name || ' '::text) || p.last_name AS user_name,
    l.change_source,
    l.field_name,
    l.old_value,
    l.new_value,
    l.reason
   FROM crm_relationship_audit_logs l
     LEFT JOIN profiles p ON l.user_id = p.id
  WHERE l.reason ~~ '%Atualização de perfil comportamental%'::text OR (l.field_name = ANY (ARRAY['big_five_openness'::text, 'big_five_confidence'::text, 'mbti_type'::text, 'mbti_e_i_score'::text, 'enneagram_type'::text, 'enneagram_wing'::text, 'temperament_primary'::text]))
  ORDER BY l.created_at DESC;
CREATE OR REPLACE VIEW public.v_contact_relatives_audit WITH (security_invoker=on) AS 
 SELECT a.id,
    a.relative_id,
    a.contact_id,
    a.user_id,
    a.change_type,
    a.changed_at,
    COALESCE(a.new_data ->> 'name'::text, a.old_data ->> 'name'::text) AS relative_name,
    COALESCE(a.new_data ->> 'relationship_type'::text, a.old_data ->> 'relationship_type'::text) AS relationship_type,
    COALESCE((p.first_name || ' '::text) || p.last_name, 'Sistema'::text) AS user_name
   FROM contact_relatives_audit a
     LEFT JOIN profiles p ON a.user_id = p.id
  ORDER BY a.changed_at DESC;
CREATE OR REPLACE VIEW public.v_entities WITH (security_invoker=on) AS 
 SELECT 'company'::entity_type AS entity_type,
    c.id,
    COALESCE(c.name, c.nome_fantasia, c.razao_social) AS display_name,
    c.email,
    c.phone,
    c.created_at,
    c.updated_at
   FROM companies c
UNION ALL
 SELECT 'contact'::entity_type AS entity_type,
    p.id,
    TRIM(BOTH ' '::text FROM concat_ws(' '::text, p.first_name, p.last_name)) AS display_name,
    p.email,
    p.phone,
    p.created_at,
    p.updated_at
   FROM contacts p;
CREATE OR REPLACE VIEW public.v_life_events_audit WITH (security_invoker=on) AS 
 SELECT h.id,
    h.life_event_id,
    h.contact_id,
    h.user_id,
    COALESCE((p.first_name || ' '::text) || p.last_name, 'Sistema'::text) AS user_name,
    h.event_type,
    h.title,
    h.event_date,
    h.recurring,
    h.reminder_days_before,
    h.change_type,
    h.reason,
    h.changed_at
   FROM life_events_history h
     LEFT JOIN profiles p ON h.user_id = p.id
  ORDER BY h.changed_at DESC;
CREATE OR REPLACE VIEW public.vw_contacts_nlp WITH (security_invoker=on) AS 
 SELECT id AS contact_id,
    first_name,
    last_name,
    vak_dominant,
    motivation_direction,
    working_style,
    user_id
   FROM contacts c;
