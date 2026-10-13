-- Isola as views do dashboard e vincula logs de erro à sessão autenticada.
CREATE SCHEMA IF NOT EXISTS _dormant;
CREATE TABLE IF NOT EXISTS _dormant.inactivity_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type varchar(50) NOT NULL,
  days_inactive integer,
  last_interaction_date timestamptz,
  previous_interaction_frequency numeric(5,2),
  current_interaction_frequency numeric(5,2),
  severity varchar(20),
  risk_score integer,
  context_data jsonb,
  recommended_actions text[],
  urgency_reason text,
  status varchar(20) DEFAULT 'active',
  acknowledged_by uuid REFERENCES public.profiles(id),
  acknowledged_at timestamptz,
  resolution_notes text,
  resolved_at timestamptz,
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE _dormant.inactivity_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dashboard_alert_owner_select ON _dormant.inactivity_alerts;
CREATE POLICY dashboard_alert_owner_select ON _dormant.inactivity_alerts
FOR SELECT TO authenticated USING (
  (contact_id IS NOT NULL OR company_id IS NOT NULL)
  AND (contact_id IS NULL OR EXISTS (SELECT 1 FROM public.contacts c
    WHERE c.id = inactivity_alerts.contact_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL))
  AND (company_id IS NULL OR EXISTS (SELECT 1 FROM public.companies c
    WHERE c.id = inactivity_alerts.company_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL))
);
GRANT USAGE ON SCHEMA _dormant TO authenticated;
GRANT SELECT ON _dormant.inactivity_alerts TO authenticated;

CREATE OR REPLACE VIEW public.vw_active_alerts
WITH (security_invoker = true) AS
SELECT ia.id, ia.alert_type, ia.contact_id,
  COALESCE(c.full_name, (c.first_name || ' ') || c.last_name) AS contact_name,
  ia.company_id, COALESCE(co.nome_crm, co.razao_social) AS company_name,
  ia.days_inactive, ia.last_interaction_date, ia.severity, ia.risk_score,
  ia.recommended_actions, ia.urgency_reason, ia.status, ia.detected_at,
  CASE ia.severity
    WHEN 'critical' THEN '🔴 CRÍTICO' WHEN 'high' THEN '🟠 ALTO'
    WHEN 'medium' THEN '🟡 MÉDIO' ELSE '🟢 BAIXO'
  END AS severity_label,
  CASE ia.alert_type
    WHEN 'contact_inactive' THEN '😴 Contato Inativo'::varchar
    WHEN 'company_inactive' THEN '🏢 Empresa Inativa'::varchar
    WHEN 'deal_stalled' THEN '⏸️ Negócio Parado'::varchar
    WHEN 'engagement_drop' THEN '📉 Queda de Engajamento'::varchar
    ELSE ia.alert_type
  END AS type_label
FROM _dormant.inactivity_alerts ia
LEFT JOIN public.contacts c ON c.id = ia.contact_id
  AND c.user_id = auth.uid() AND c.deleted_at IS NULL
LEFT JOIN public.companies co ON co.id = ia.company_id
  AND co.user_id = auth.uid() AND co.deleted_at IS NULL
WHERE ia.status = 'active'
  AND (ia.contact_id IS NOT NULL OR ia.company_id IS NOT NULL)
  AND (ia.contact_id IS NULL OR c.id IS NOT NULL)
  AND (ia.company_id IS NULL OR co.id IS NOT NULL)
ORDER BY CASE ia.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2
  WHEN 'medium' THEN 3 ELSE 4 END, ia.risk_score DESC;

CREATE OR REPLACE VIEW public.vw_contacts_sem_apelido
WITH (security_invoker = true) AS
SELECT ct.id AS contact_id, ct.full_name, ct.first_name, ct.nome_tratamento,
  ct.apelido, ct.cargo,
  (SELECT ce.email FROM public.contact_emails ce
   WHERE ce.contact_id = ct.id AND ce.is_primary = true LIMIT 1) AS email,
  (SELECT cp.numero_normalizado FROM public.contact_phones cp
   WHERE cp.contact_id = ct.id AND cp.is_primary = true LIMIT 1) AS phone,
  ct.company_id, c.nome_crm AS empresa, addr.cidade,
  (SELECT count(*) FROM public.interactions i
   WHERE i.contact_id = ct.id AND i.user_id = auth.uid())::integer AS total_interacoes,
  COALESCE((SELECT max(i.created_at) FROM public.interactions i
    WHERE i.contact_id = ct.id AND i.user_id = auth.uid()), ct.updated_at) AS ultima_interacao,
  CASE WHEN ct.apelido IS NOT NULL THEN 'OK'
    WHEN EXISTS (SELECT 1 FROM public.interactions i
      WHERE i.contact_id = ct.id AND i.user_id = auth.uid()) THEN 'ALTA'
    WHEN ct.company_id IS NOT NULL THEN 'MEDIA' ELSE 'BAIXA'
  END AS prioridade_preenchimento
FROM public.contacts ct
LEFT JOIN public.companies c ON c.id = ct.company_id
  AND c.user_id = auth.uid() AND c.deleted_at IS NULL
LEFT JOIN LATERAL (
  SELECT ca.cidade FROM public.company_addresses ca
  WHERE ca.company_id = c.id ORDER BY ca.is_primary DESC LIMIT 1
) addr ON true
WHERE ct.user_id = auth.uid() AND ct.deleted_at IS NULL AND ct.apelido IS NULL;

CREATE OR REPLACE VIEW public.vw_pending_followups
WITH (security_invoker = true) AS
SELECT i.id AS interaction_id, i.contact_id,
  COALESCE(c.full_name, (c.first_name || ' ') || c.last_name) AS contact_name,
  (SELECT ce.email FROM public.contact_emails ce
   WHERE ce.contact_id = c.id AND ce.is_primary = true LIMIT 1) AS contact_email,
  COALESCE(co.nome_crm, co.razao_social) AS company_name,
  i.title AS interaction_title, i.type AS interaction_type,
  COALESCE(i.follow_up_date::timestamptz, i.data_followup) AS follow_up_date,
  i.conteudo AS follow_up_notes, p.full_name AS owner_name, p.email AS owner_email,
  CASE
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() - interval '7 days' THEN 'CRÍTICO - Muito atrasado'
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() - interval '2 days' THEN 'ATRASADO'
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup)::date = CURRENT_DATE THEN 'VENCIDO HOJE'
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup)::date = CURRENT_DATE + 1 THEN 'AMANHÃ'
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() + interval '7 days' THEN 'ESTA SEMANA'
    ELSE 'FUTURO'
  END AS followup_status,
  EXTRACT(day FROM now() - COALESCE(i.follow_up_date::timestamptz, i.data_followup))::integer AS days_overdue,
  CASE
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() - interval '7 days' THEN 1
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() THEN 2
    WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() + interval '1 day' THEN 3
    ELSE 4
  END AS priority,
  da.primary_profile AS contact_disc, c.relationship_score AS closing_score
FROM public.interactions i
JOIN public.contacts c ON c.id = i.contact_id
  AND c.user_id = auth.uid() AND c.deleted_at IS NULL
LEFT JOIN public.companies co ON co.id = c.company_id
  AND co.user_id = auth.uid() AND co.deleted_at IS NULL
LEFT JOIN public.profiles p ON p.id = i.user_id
LEFT JOIN LATERAL (
  SELECT d.primary_profile FROM public.disc_analysis_history d
  WHERE d.contact_id = c.id AND d.user_id = auth.uid()
  ORDER BY d.analyzed_at DESC, d.id DESC LIMIT 1
) da ON true
WHERE i.user_id = auth.uid()
  AND (i.follow_up_required = true OR i.requer_followup = true)
  AND (i.followup_concluido = false OR i.followup_concluido IS NULL)
  AND COALESCE(i.follow_up_date::timestamptz, i.data_followup) IS NOT NULL
ORDER BY priority, COALESCE(i.follow_up_date::timestamptz, i.data_followup);

CREATE OR REPLACE VIEW public.vw_interacoes_sem_apelido
WITH (security_invoker = true) AS
SELECT i.id AS interaction_id, i.contact_id,
  (c.first_name || ' ') || COALESCE(c.last_name, '') AS full_name,
  NULL::text AS nome_tratamento, i.company_id, co.nome_crm AS empresa,
  i.channel AS canal, i.data_interacao, i.created_by,
  i.usuario_responsavel_id AS vendedor, i.user_id
FROM public.interactions i
JOIN public.contacts c ON c.id = i.contact_id
  AND c.user_id = auth.uid() AND c.deleted_at IS NULL
LEFT JOIN public.companies co ON co.id = i.company_id
  AND co.user_id = auth.uid() AND co.deleted_at IS NULL
WHERE i.user_id = auth.uid();

ALTER POLICY "Authenticated users can insert error logs"
ON public.error_logs TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Rollback: restaurar as definições anteriores das views abaixo e a policy de INSERT.
-- Preserva a fonte de alertas e seus dados. No canônico, seu RLS estava desabilitado.
-- DROP POLICY IF EXISTS dashboard_alert_owner_select ON _dormant.inactivity_alerts;
-- ALTER TABLE _dormant.inactivity_alerts DISABLE ROW LEVEL SECURITY;
-- ALTER POLICY "Authenticated users can insert error logs" ON public.error_logs
-- TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
-- CREATE OR REPLACE VIEW public.vw_active_alerts WITH (security_invoker = true) AS
-- SELECT ia.id, ia.alert_type, ia.contact_id,
--   COALESCE(c.full_name, (c.first_name || ' ') || c.last_name) AS contact_name,
--   ia.company_id, COALESCE(co.nome_crm, co.razao_social) AS company_name,
--   ia.days_inactive, ia.last_interaction_date, ia.severity, ia.risk_score,
--   ia.recommended_actions, ia.urgency_reason, ia.status, ia.detected_at,
--   CASE ia.severity WHEN 'critical' THEN '🔴 CRÍTICO' WHEN 'high' THEN '🟠 ALTO'
--     WHEN 'medium' THEN '🟡 MÉDIO' ELSE '🟢 BAIXO' END AS severity_label,
--   CASE ia.alert_type
--     WHEN 'contact_inactive' THEN '😴 Contato Inativo'::varchar
--     WHEN 'company_inactive' THEN '🏢 Empresa Inativa'::varchar
--     WHEN 'deal_stalled' THEN '⏸️ Negócio Parado'::varchar
--     WHEN 'engagement_drop' THEN '📉 Queda de Engajamento'::varchar
--     ELSE ia.alert_type END AS type_label
-- FROM _dormant.inactivity_alerts ia
-- LEFT JOIN public.contacts c ON ia.contact_id = c.id
-- LEFT JOIN public.companies co ON ia.company_id = co.id
-- WHERE ia.status = 'active'
-- ORDER BY CASE ia.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2
--   WHEN 'medium' THEN 3 ELSE 4 END, ia.risk_score DESC;
-- CREATE OR REPLACE VIEW public.vw_contacts_sem_apelido WITH (security_invoker = true) AS
-- SELECT ct.id AS contact_id, ct.full_name, ct.first_name, ct.nome_tratamento,
--   ct.apelido, ct.cargo,
--   (SELECT ce.email FROM public.contact_emails ce
--    WHERE ce.contact_id = ct.id AND ce.is_primary = true LIMIT 1) AS email,
--   (SELECT cp.numero_normalizado FROM public.contact_phones cp
--    WHERE cp.contact_id = ct.id AND cp.is_primary = true LIMIT 1) AS phone,
--   ct.company_id, c.nome_crm AS empresa, addr.cidade,
--   (SELECT count(*) FROM public.interactions i WHERE i.contact_id = ct.id)::integer AS total_interacoes,
--   COALESCE((SELECT max(i.created_at) FROM public.interactions i
--     WHERE i.contact_id = ct.id), ct.updated_at) AS ultima_interacao,
--   CASE WHEN ct.apelido IS NOT NULL THEN 'OK'
--     WHEN EXISTS (SELECT 1 FROM public.interactions i WHERE i.contact_id = ct.id) THEN 'ALTA'
--     WHEN ct.company_id IS NOT NULL THEN 'MEDIA' ELSE 'BAIXA' END AS prioridade_preenchimento
-- FROM public.contacts ct
-- LEFT JOIN public.companies c ON c.id = ct.company_id
-- LEFT JOIN LATERAL (SELECT ca.cidade FROM public.company_addresses ca
--   WHERE ca.company_id = c.id ORDER BY ca.is_primary DESC LIMIT 1) addr ON true
-- WHERE ct.deleted_at IS NULL AND ct.apelido IS NULL;
-- CREATE OR REPLACE VIEW public.vw_pending_followups WITH (security_invoker = true) AS
-- SELECT i.id AS interaction_id, i.contact_id,
--   COALESCE(c.full_name, (c.first_name || ' ') || c.last_name) AS contact_name,
--   (SELECT ce.email FROM public.contact_emails ce
--    WHERE ce.contact_id = c.id AND ce.is_primary = true LIMIT 1) AS contact_email,
--   COALESCE(co.nome_crm, co.razao_social) AS company_name,
--   i.title AS interaction_title, i.type AS interaction_type,
--   COALESCE(i.follow_up_date::timestamptz, i.data_followup) AS follow_up_date,
--   i.conteudo AS follow_up_notes, p.full_name AS owner_name, p.email AS owner_email,
--   CASE
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() - interval '7 days' THEN 'CRÍTICO - Muito atrasado'
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() - interval '2 days' THEN 'ATRASADO'
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup)::date = CURRENT_DATE THEN 'VENCIDO HOJE'
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup)::date = CURRENT_DATE + 1 THEN 'AMANHÃ'
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() + interval '7 days' THEN 'ESTA SEMANA'
--     ELSE 'FUTURO' END AS followup_status,
--   EXTRACT(day FROM now() - COALESCE(i.follow_up_date::timestamptz, i.data_followup))::integer AS days_overdue,
--   CASE
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() - interval '7 days' THEN 1
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() THEN 2
--     WHEN COALESCE(i.follow_up_date::timestamptz, i.data_followup) < now() + interval '1 day' THEN 3
--     ELSE 4 END AS priority,
--   da.primary_profile AS contact_disc, c.relationship_score AS closing_score
-- FROM public.interactions i JOIN public.contacts c ON i.contact_id = c.id
-- LEFT JOIN public.companies co ON c.company_id = co.id
-- LEFT JOIN _dormant.user_contacts_link ucl ON c.id = ucl.contact_id
-- LEFT JOIN public.profiles p ON ucl.user_id = p.id
-- LEFT JOIN _dormant.disc_assessments da ON c.id = da.contact_id
--   AND (da.is_current = true OR da.is_current IS NULL)
-- WHERE (i.follow_up_required = true OR i.requer_followup = true)
--   AND (i.followup_concluido = false OR i.followup_concluido IS NULL)
--   AND COALESCE(i.follow_up_date::timestamptz, i.data_followup) IS NOT NULL
-- ORDER BY priority, COALESCE(i.follow_up_date::timestamptz, i.data_followup);
-- CREATE OR REPLACE VIEW public.vw_interacoes_sem_apelido WITH (security_invoker = true) AS
-- SELECT i.id AS interaction_id, i.contact_id,
--   (c.first_name || ' ') || COALESCE(c.last_name, '') AS full_name,
--   NULL::text AS nome_tratamento, i.company_id, co.nome_crm AS empresa,
--   i.channel AS canal, i.data_interacao, i.created_by,
--   i.usuario_responsavel_id AS vendedor, i.user_id
-- FROM public.interactions i
-- LEFT JOIN public.contacts c ON c.id = i.contact_id
-- LEFT JOIN public.companies co ON co.id = i.company_id;