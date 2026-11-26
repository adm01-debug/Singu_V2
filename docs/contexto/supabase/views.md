# Views


## public.document_signatures_public (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.document_signatures |
| populada | n/a |
| comentário |  |


```sql
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
```

## public.forms_public (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.forms |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    slug,
    name,
    description,
    fields,
    redirect_url,
    success_message
   FROM forms
  WHERE is_published = true;
```

## public.landing_pages_public (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.landing_pages |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    slug,
    title,
    description,
    blocks,
    theme,
    redirect_url
   FROM landing_pages
  WHERE is_published = true;
```

## public.mv_daily_kpis (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | reporting.mv_daily_kpis |
| populada | n/a |
| comentário |  |


```sql
SELECT snapshot_date,
    total_companies,
    total_contacts,
    total_customers,
    active_customers,
    total_revenue,
    interactions_today,
    total_salespeople
   FROM reporting.mv_daily_kpis;
```

## public.mv_daily_stats (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | reporting.mv_daily_stats |
| populada | n/a |
| comentário |  |


```sql
SELECT stats_date,
    total_companies,
    total_contacts,
    open_deals,
    pipeline_value,
    monthly_deals_won,
    monthly_revenue,
    monthly_interactions,
    monthly_proposals,
    overdue_tasks,
    overdue_followups,
    calculated_at
   FROM reporting.mv_daily_stats;
```

## public.push_subscriptions_safe (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.push_subscriptions |
| populada | n/a |
| comentário | SINGU: view segura de push_subscriptions. Omite chaves criptográficas (p256dh, auth). security_invoker=true respeita RLS do owner da view. |


```sql
SELECT id,
    user_id,
    endpoint,
    created_at
   FROM push_subscriptions;
```

## public.slow_queries_audit (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | extensions.pg_stat_statements |
| populada | n/a |
| comentário |  |


```sql
SELECT query,
    calls,
    total_exec_time / 1000::double precision AS total_exec_seconds,
    mean_exec_time AS mean_exec_ms,
    rows
   FROM pg_stat_statements
  ORDER BY total_exec_time DESC
 LIMIT 50;
```

## public.users_public (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    name,
    email,
    departamento,
    is_active,
    is_vendedor
   FROM users;
```

## public.v_channel_stats (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT channel,
    count(*) AS total,
    count(*) FILTER (WHERE data_interacao >= (CURRENT_DATE - '30 days'::interval)) AS ultimos_30d,
    count(*) FILTER (WHERE data_interacao >= (CURRENT_DATE - '7 days'::interval)) AS ultimos_7d,
    count(DISTINCT company_id) AS empresas_distintas,
    count(DISTINCT contact_id) AS contatos_distintos
   FROM interactions
  GROUP BY channel
  ORDER BY (count(*)) DESC;
```

## public.v_companies_metrics (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contacts, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    nome_fantasia,
    razao_social,
    cnpj,
    status,
    is_customer,
    is_supplier,
    ( SELECT count(*) AS count
           FROM contacts
          WHERE contacts.company_id = c.id) AS total_contatos,
    ( SELECT count(*) AS count
           FROM interactions
          WHERE interactions.company_id = c.id) AS total_interacoes,
    ( SELECT max(interactions.data_interacao) AS max
           FROM interactions
          WHERE interactions.company_id = c.id) AS ultima_interacao,
    created_at,
    updated_at
   FROM companies c;
```

## public.v_company_summary (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.company_emails, public.company_phones, public.deals, public.interactions, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    cnpj,
    COALESCE(nome_fantasia, nome_crm) AS nome,
    status::text AS status,
    user_id,
    is_customer,
    ( SELECT COALESCE(p.full_name, p.email) AS "coalesce"
           FROM profiles p
          WHERE p.id = c.user_id) AS responsavel,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary
         LIMIT 1) AS email,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary
         LIMIT 1) AS telefone,
    ( SELECT ca.cidade
           FROM company_addresses ca
          WHERE ca.company_id = c.id
         LIMIT 1) AS cidade,
    ( SELECT ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = c.id
         LIMIT 1) AS estado,
    ( SELECT count(*) AS count
           FROM interactions i
          WHERE i.company_id = c.id) AS total_interactions,
    ( SELECT max(i.data_interacao) AS max
           FROM interactions i
          WHERE i.company_id = c.id) AS last_interaction,
    ( SELECT count(*) AS count
           FROM deals d
          WHERE d.company_id = c.id AND d.status = 'ganho'::text) AS deals_won,
    ( SELECT COALESCE(sum(d.valor), 0::numeric) AS "coalesce"
           FROM deals d
          WHERE d.company_id = c.id AND d.status = 'ganho'::text) AS total_revenue,
    created_at
   FROM companies c
  WHERE deleted_at IS NULL;
```

## public.v_contact_personality_audit (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.crm_relationship_audit_logs, public.profiles |
| populada | n/a |
| comentário |  |


```sql
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
```

## public.v_contact_relatives_audit (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.contact_relatives_audit, public.profiles |
| populada | n/a |
| comentário |  |


```sql
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
```

## public.v_contact_summary (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_emails, public.contact_phones, public.contacts, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    COALESCE(full_name, first_name) AS nome,
    cargo,
    company_id,
    ( SELECT COALESCE(c.nome_fantasia, c.nome_crm) AS "coalesce"
           FROM companies c
          WHERE c.id = ct.company_id) AS empresa,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = ct.id AND ce.is_primary
         LIMIT 1) AS email,
    ( SELECT cp.numero
           FROM contact_phones cp
          WHERE cp.contact_id = ct.id AND cp.is_primary
         LIMIT 1) AS telefone,
    ( SELECT count(*) AS count
           FROM interactions i
          WHERE i.contact_id = ct.id) AS total_interactions,
    created_at
   FROM contacts ct
  WHERE deleted_at IS NULL;
```

## public.v_daily_kpis (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contacts, public.deals, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT CURRENT_DATE AS date,
    ( SELECT count(*) AS count
           FROM companies
          WHERE companies.deleted_at IS NULL) AS total_companies,
    ( SELECT count(*) AS count
           FROM companies
          WHERE companies.is_customer = true AND companies.deleted_at IS NULL) AS total_customers,
    ( SELECT count(*) AS count
           FROM contacts
          WHERE contacts.deleted_at IS NULL) AS total_contacts,
    ( SELECT count(*) AS count
           FROM deals
          WHERE deals.status <> ALL (ARRAY['ganho'::text, 'perdido'::text])) AS open_deals,
    ( SELECT COALESCE(sum(deals.valor), 0::numeric) AS "coalesce"
           FROM deals
          WHERE deals.status <> ALL (ARRAY['ganho'::text, 'perdido'::text])) AS pipeline_value,
    ( SELECT count(*) AS count
           FROM interactions
          WHERE date(interactions.data_interacao) = CURRENT_DATE) AS interactions_today;
```

## public.v_dashboard_kpis (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contacts, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT ( SELECT count(*) AS count
           FROM companies) AS total_empresas,
    ( SELECT count(*) AS count
           FROM companies
          WHERE companies.is_customer = true) AS total_clientes,
    ( SELECT count(*) AS count
           FROM contacts) AS total_contatos,
    ( SELECT count(*) AS count
           FROM contacts
          WHERE contacts.company_id IS NOT NULL) AS contatos_vinculados,
    ( SELECT count(*) AS count
           FROM interactions) AS total_interacoes,
    ( SELECT count(*) AS count
           FROM interactions
          WHERE interactions.data_interacao >= (CURRENT_DATE - '30 days'::interval)) AS interacoes_30d,
    ( SELECT count(*) AS count
           FROM interactions
          WHERE interactions.data_interacao >= (CURRENT_DATE - '7 days'::interval)) AS interacoes_7d,
    ( SELECT count(DISTINCT interactions.company_id) AS count
           FROM interactions
          WHERE interactions.data_interacao >= (CURRENT_DATE - '30 days'::interval)) AS empresas_ativas_30d;
```

## public.v_deal_summary (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.deals, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    titulo,
    valor,
    status,
    pipeline_stage,
    probabilidade,
    company_id,
    ( SELECT COALESCE(c.nome_fantasia, c.nome_crm) AS "coalesce"
           FROM companies c
          WHERE c.id = d.company_id) AS empresa,
    user_id,
    ( SELECT COALESCE(p.full_name, p.email) AS "coalesce"
           FROM profiles p
          WHERE p.id = d.user_id) AS vendedor,
    previsao_fechamento,
    created_at,
    closed_at,
    EXTRACT(day FROM COALESCE(closed_at, now()) - created_at)::integer AS cycle_days
   FROM deals d;
```

## public.v_entities (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_emails, public.company_phones, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT 'company'::entity_type AS entity_type,
    c.id,
    COALESCE(c.nome_crm, c.nome_fantasia, c.razao_social) AS display_name,
    (( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id
         LIMIT 1))::text AS email,
    (( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id
         LIMIT 1))::text AS phone,
    c.created_at,
    c.updated_at
   FROM companies c
UNION ALL
 SELECT 'contact'::entity_type AS entity_type,
    p.id,
    TRIM(BOTH FROM concat_ws(' '::text, p.first_name, p.last_name)) AS display_name,
    p.email,
    p.phone,
    p.created_at,
    p.updated_at
   FROM contacts p;
```

## public.v_guardrail_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.guardrail_ml_logs |
| populada | n/a |
| comentário |  |


```sql
SELECT date_trunc('day'::text, guardrail_ml_logs.created_at) AS dia,
    count(*) AS total_checks,
    count(*) FILTER (WHERE guardrail_ml_logs.all_passed = true) AS passed,
    count(*) FILTER (WHERE guardrail_ml_logs.all_passed = false) AS blocked,
    round(count(*) FILTER (WHERE guardrail_ml_logs.all_passed = false)::numeric / NULLIF(count(*), 0)::numeric * 100::numeric, 1) AS block_rate_pct,
    array_agg(DISTINCT unnest_blocked.unnest_blocked) FILTER (WHERE unnest_blocked.unnest_blocked IS NOT NULL) AS blocked_types
   FROM guardrail_ml_logs,
    LATERAL unnest(guardrail_ml_logs.blocked_layers) unnest_blocked(unnest_blocked)
  GROUP BY (date_trunc('day'::text, guardrail_ml_logs.created_at))
  ORDER BY (date_trunc('day'::text, guardrail_ml_logs.created_at)) DESC;
```

## public.v_life_events_audit (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções | security_invoker=on |
| depende de | public.life_events_history, public.profiles |
| populada | n/a |
| comentário |  |


```sql
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
```

## public.v_model_catalog (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.model_pricing_v2 |
| populada | n/a |
| comentário |  |


```sql
SELECT tier,
    model,
    provider,
    input_cost_per_1m AS cost_input,
    output_cost_per_1m AS cost_output,
    context_window,
    capabilities,
        CASE
            WHEN input_cost_per_1m <= 0.01::double precision THEN 'ultra-low'::text
            WHEN input_cost_per_1m <= 0.05::double precision THEN 'low'::text
            WHEN input_cost_per_1m <= 0.20::double precision THEN 'medium'::text
            WHEN input_cost_per_1m <= 1.00::double precision THEN 'high'::text
            ELSE 'premium'::text
        END AS cost_tier
   FROM model_pricing_v2
  ORDER BY input_cost_per_1m;
```

## public.v_nlp_analytics (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.nlp_extractions |
| populada | n/a |
| comentário |  |


```sql
SELECT date_trunc('day'::text, created_at) AS dia,
    source_type,
    count(*) AS total_extractions,
    count(*) FILTER (WHERE sentiment_label = 'urgent'::text) AS urgent,
    count(*) FILTER (WHERE sentiment_label = 'negative'::text) AS negative,
    count(*) FILTER (WHERE sentiment_label = 'positive'::text) AS positive,
    count(*) FILTER (WHERE sentiment_label = 'neutral'::text) AS neutral,
    round(avg(processing_time_ms), 0) AS avg_processing_ms
   FROM nlp_extractions
  GROUP BY (date_trunc('day'::text, created_at)), source_type
  ORDER BY (date_trunc('day'::text, created_at)) DESC;
```

## public.v_pipeline_summary (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.deals, public.pipeline_stages |
| populada | n/a |
| comentário |  |


```sql
SELECT ps.nome AS stage,
    ps.ordem,
    count(d.id) AS deals_count,
    COALESCE(sum(d.valor), 0::numeric) AS total_value,
    COALESCE(avg(d.valor), 0::numeric) AS avg_value
   FROM pipeline_stages ps
     LEFT JOIN deals d ON d.pipeline_stage = ps.nome::text AND (d.status <> ALL (ARRAY['ganho'::text, 'perdido'::text]))
  GROUP BY ps.nome, ps.ordem
  ORDER BY ps.ordem;
```

## public.v_ragas_by_agent (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.ragas_scores |
| populada | n/a |
| comentário |  |


```sql
SELECT agent_id,
    count(*) AS evaluations,
    round(avg(faithfulness)::numeric, 3) AS avg_faithfulness,
    round(avg(answer_relevancy)::numeric, 3) AS avg_relevancy,
    round(avg(context_precision)::numeric, 3) AS avg_precision,
    round(avg(context_recall)::numeric, 3) AS avg_recall,
    round(avg(overall_score)::numeric, 3) AS avg_overall,
    min(overall_score) AS min_score,
    max(overall_score) AS max_score
   FROM ragas_scores
  GROUP BY agent_id;
```

## public.v_recent_interactions (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT i.id,
    i.company_id,
    c.nome_fantasia AS empresa_nome,
    i.contact_id,
    i.channel,
    i.direction,
    i.status,
    i.assunto,
    i.resumo,
    i.data_interacao,
    i.duracao_segundos
   FROM interactions i
     LEFT JOIN companies c ON i.company_id = c.id
  ORDER BY i.data_interacao DESC
 LIMIT 1000;
```

## public.vw_active_alerts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.inactivity_alerts, public.companies, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT ia.id,
    ia.alert_type,
    ia.contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ia.company_id,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    ia.days_inactive,
    ia.last_interaction_date,
    ia.severity,
    ia.risk_score,
    ia.recommended_actions,
    ia.urgency_reason,
    ia.status,
    ia.detected_at,
        CASE ia.severity
            WHEN 'critical'::text THEN '🔴 CRÍTICO'::text
            WHEN 'high'::text THEN '🟠 ALTO'::text
            WHEN 'medium'::text THEN '🟡 MÉDIO'::text
            ELSE '🟢 BAIXO'::text
        END AS severity_label,
        CASE ia.alert_type
            WHEN 'contact_inactive'::text THEN '😴 Contato Inativo'::character varying
            WHEN 'company_inactive'::text THEN '🏢 Empresa Inativa'::character varying
            WHEN 'deal_stalled'::text THEN '⏸️ Negócio Parado'::character varying
            WHEN 'engagement_drop'::text THEN '📉 Queda de Engajamento'::character varying
            ELSE ia.alert_type
        END AS type_label
   FROM _dormant.inactivity_alerts ia
     LEFT JOIN contacts c ON c.id = ia.contact_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL
     LEFT JOIN companies co ON co.id = ia.company_id AND co.user_id = auth.uid() AND co.deleted_at IS NULL
  WHERE ia.status::text = 'active'::text AND (ia.contact_id IS NOT NULL OR ia.company_id IS NOT NULL) AND (ia.contact_id IS NULL OR c.id IS NOT NULL) AND (ia.company_id IS NULL OR co.id IS NOT NULL)
  ORDER BY (
        CASE ia.severity
            WHEN 'critical'::text THEN 1
            WHEN 'high'::text THEN 2
            WHEN 'medium'::text THEN 3
            ELSE 4
        END), ia.risk_score DESC;
```

## public.vw_alertas_pendentes_vendedor (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.alertas_inativacao, public.companies, public.company_addresses, public.company_emails, public.company_phones |
| populada | n/a |
| comentário |  |


```sql
SELECT a.id AS alerta_id,
    a.vendedor_id,
    a.vendedor_nome,
    a.customer_id,
    a.company_id,
    c.nome_crm AS empresa,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    addr.cidade,
    addr.estado,
    a.tipo_alerta,
    a.severidade,
    a.titulo AS nivel,
    a.dias_sem_compra,
    a.dias_para_inativar,
    a.valor_em_risco,
    a.titulo,
    a.mensagem,
    a.acao_sugerida,
    a.status,
    a.data_referencia,
    a.created_at
   FROM alertas_inativacao a
     JOIN companies c ON c.id = a.company_id
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE a.status = 'PENDENTE'::text AND c.deleted_at IS NULL;
```

## public.vw_alertas_vendedor (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.alertas_inativacao, public.companies, public.company_emails, public.company_phones |
| populada | n/a |
| comentário |  |


```sql
SELECT a.vendedor_id,
    a.vendedor_nome,
    a.tipo_alerta,
        CASE
            WHEN a.severidade = 1 THEN '🔴'::text
            WHEN a.severidade = 2 THEN '🟠'::text
            WHEN a.severidade = 3 THEN '🟡'::text
            ELSE '🔵'::text
        END AS icone,
    a.severidade,
    a.customer_id,
    c.nome_crm AS empresa,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    a.dias_sem_compra,
    a.mensagem,
    a.acao_sugerida AS acao
   FROM alertas_inativacao a
     JOIN companies c ON c.id = a.company_id
  WHERE a.status = 'PENDENTE'::text AND c.deleted_at IS NULL;
```

## public.vw_apelidos_progresso (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contacts, public.customers |
| populada | n/a |
| comentário | Dashboard: progresso de preenchimento de apelidos por vendedor. |


```sql
SELECT COALESCE(cu.vendedor_nome, 'Sem vendedor'::text) AS vendedor,
    count(*) AS total_contatos,
    count(c.apelido) AS com_apelido,
    count(*) - count(c.apelido) AS sem_apelido,
    round(count(c.apelido)::numeric / GREATEST(count(*), 1::bigint)::numeric * 100::numeric, 1) AS percentual_preenchido
   FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     LEFT JOIN customers cu ON cu.company_id = co.id
  WHERE c.deleted_at IS NULL
  GROUP BY (COALESCE(cu.vendedor_nome, 'Sem vendedor'::text))
  ORDER BY (count(*) - count(c.apelido)) DESC;
```

## public.vw_best_closing_moments (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.closing_moment_analysis, public.companies, public.contact_emails, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    cma.recommended_timing,
    cma.timing_score,
    cma.emotional_readiness,
    cma.engagement_level,
    cma.positive_signals,
    cma.warning_signals,
    cma.risk_of_losing,
    cma.risk_factors,
    cma.opportunity_window_start,
    cma.opportunity_window_end,
    cma.best_days,
    cma.best_time_ranges,
    cma.recommended_approach,
    cma.key_talking_points,
    cma.avoid_topics,
        CASE cma.recommended_timing
            WHEN 'now'::text THEN '🔥 AGORA!'::text
            WHEN 'soon'::text THEN '⏰ EM BREVE'::text
            WHEN 'wait'::text THEN '⏳ AGUARDAR'::text
            WHEN 'not_ready'::text THEN '❌ NÃO PRONTO'::text
            ELSE '❓ Analisar'::text
        END AS timing_status,
        CASE
            WHEN cma.recommended_timing::text = 'now'::text AND cma.timing_score >= 80 THEN 1
            WHEN cma.recommended_timing::text = 'now'::text THEN 2
            WHEN cma.recommended_timing::text = 'soon'::text THEN 3
            ELSE 4
        END AS priority_rank,
    cma.valid_until,
        CASE
            WHEN cma.valid_until < now() THEN '⚠️ Expirada'::text
            ELSE '✅ Válida'::text
        END AS validity_status
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN closing_moment_analysis cma ON c.id = cma.contact_id AND cma.is_current = true
  WHERE cma.id IS NOT NULL
  ORDER BY (
        CASE
            WHEN cma.recommended_timing::text = 'now'::text AND cma.timing_score >= 80 THEN 1
            WHEN cma.recommended_timing::text = 'now'::text THEN 2
            WHEN cma.recommended_timing::text = 'soon'::text THEN 3
            ELSE 4
        END), cma.timing_score DESC;
```

## public.vw_carrier_alerts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.alerts, public.carriers, public.companies |
| populada | n/a |
| comentário | Alertas ativos de transportadoras (carrier_*). FIX B2: filtra deleted_at IS NULL. |


```sql
SELECT a.id AS alert_id,
    a.type,
    a.priority,
    a.title,
    a.message,
    a.status AS alert_status,
    a.metadata,
    a.created_at,
    a.read_at,
    co.nome_crm AS transportadora,
    co.cnpj,
    ca.homologado,
    ca.score_geral
   FROM alerts a
     JOIN companies co ON co.id = a.company_id AND co.deleted_at IS NULL
     LEFT JOIN carriers ca ON ca.company_id = a.company_id
  WHERE a.type ~~ 'carrier_%'::text
  ORDER BY (
        CASE a.priority
            WHEN 'critical'::text THEN 1
            WHEN 'high'::text THEN 2
            WHEN 'medium'::text THEN 3
            WHEN 'low'::text THEN 4
            ELSE 5
        END), a.created_at DESC;
```

## public.vw_carrier_by_state (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_scores, public.carriers, public.companies, public.company_addresses |
| populada | n/a |
| comentário | Distribuição geográfica de transportadoras por estado com scores médios |


```sql
SELECT COALESCE(addr.estado, 'SEM ESTADO'::character varying) AS estado,
    count(*) AS total,
    count(*) FILTER (WHERE ca.homologado = true) AS homologados,
    count(*) FILTER (WHERE ca.homologado = false) AS nao_homologados,
    round(avg(cs.score_geral), 2) AS score_medio,
    count(cs.carrier_id) AS com_avaliacao
   FROM carriers ca
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
     LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
     LEFT JOIN LATERAL ( SELECT cad.estado
           FROM company_addresses cad
          WHERE cad.company_id = co.id
          ORDER BY cad.is_primary DESC
         LIMIT 1) addr ON true
  GROUP BY addr.estado
  ORDER BY (count(*)) DESC;
```

## public.vw_carrier_data_quality (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carriers, public.companies, public.company_addresses, public.company_emails, public.company_phones, public.contacts |
| populada | n/a |
| comentário | Radiografia de qualidade de dados das transportadoras: % CNPJ, telefone, email, endereço, contato |


```sql
SELECT count(*) AS total_transportadoras,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text) AS com_cnpj,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cnpj,
    count(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.razao_social <> ''::text) AS com_razao_social,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id))) AS com_telefone,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_telefone,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS com_email,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_email,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id))) AS com_endereco,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_endereco,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id))) AS com_contato,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_contato,
    count(*) FILTER (WHERE co.situacao_rf IS NOT NULL) AS com_situacao_rf,
    count(*) FILTER (WHERE NOT (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND NOT (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS sem_nenhum_contato,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id))) AS cadastro_completo,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cadastro_completo
   FROM carriers ca
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL;
```

## public.vw_carrier_evaluations_history (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_evaluations, public.carriers, public.companies, public.users |
| populada | n/a |
| comentário | Histórico de avaliações de transportadoras. FIX B2: filtra deleted_at IS NULL. |


```sql
SELECT co.nome_crm AS transportadora,
    ce.data_avaliacao,
    ce.referencia,
    ce.nota_pontualidade,
    ce.nota_conservacao,
    ce.nota_preco_frete,
    ce.nota_rastreamento,
    ce.nota_cobertura,
    ce.nota_geral,
    ce.comentario,
    u.name AS avaliador,
    u.departamento AS departamento_avaliador,
    ca.id AS carrier_id,
    ca.company_id,
    ce.id AS evaluation_id,
    ce.created_at
   FROM carrier_evaluations ce
     JOIN carriers ca ON ca.id = ce.carrier_id
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
     JOIN users u ON u.id = ce.avaliador_id
  ORDER BY ce.data_avaliacao DESC, ce.created_at DESC;
```

## public.vw_carrier_homologation_control (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_homologations, public.carriers, public.companies, public.users |
| populada | n/a |
| comentário | Controle de homologação de transportadoras: situação calculada, dias para vencer |


```sql
SELECT co.nome_crm AS transportadora,
    co.cnpj,
    ca.homologado,
    ch.status AS ultimo_status,
    ch.data_solicitacao,
    ch.data_decisao,
    ch.validade,
        CASE
            WHEN ch.validade IS NULL THEN NULL::integer
            WHEN ch.validade < CURRENT_DATE THEN 0 - (CURRENT_DATE - ch.validade)
            ELSE ch.validade - CURRENT_DATE
        END AS dias_para_vencer,
        CASE
            WHEN ch.status IS NULL THEN 'NUNCA_SOLICITADA'::text
            WHEN ch.status = 'homologado'::carrier_homologation_status AND ch.validade < CURRENT_DATE THEN 'VENCIDA'::text
            WHEN ch.status = 'homologado'::carrier_homologation_status AND ch.validade >= CURRENT_DATE AND ch.validade <= (CURRENT_DATE + 30) THEN 'VENCENDO_EM_BREVE'::text
            WHEN ch.status = 'homologado'::carrier_homologation_status THEN 'VIGENTE'::text
            ELSE ch.status::text
        END AS situacao,
    u.name AS avaliador,
    ch.motivo_reprovacao,
    ch.observacoes,
    ch.criterios_checados,
    ca.id AS carrier_id,
    ca.company_id,
    ch.id AS homologation_id
   FROM carriers ca
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
     LEFT JOIN LATERAL ( SELECT ch2.id,
            ch2.carrier_id,
            ch2.status,
            ch2.avaliador_id,
            ch2.data_solicitacao,
            ch2.data_decisao,
            ch2.validade,
            ch2.criterios_checados,
            ch2.motivo_reprovacao,
            ch2.observacoes,
            ch2.created_at,
            ch2.updated_at
           FROM carrier_homologations ch2
          WHERE ch2.carrier_id = ca.id
          ORDER BY ch2.created_at DESC
         LIMIT 1) ch ON true
     LEFT JOIN users u ON u.id = ch.avaliador_id
  ORDER BY (
        CASE
            WHEN ch.status IS NULL THEN 0
            WHEN ch.status = 'pendente'::carrier_homologation_status THEN 1
            WHEN ch.status = 'em_analise'::carrier_homologation_status THEN 2
            WHEN ch.status = 'homologado'::carrier_homologation_status AND ch.validade < CURRENT_DATE THEN 3
            ELSE 10
        END), co.nome_crm;
```

## public.vw_carrier_homologation_queue (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_homologations, public.carriers, public.companies, public.company_addresses, public.company_emails, public.company_phones |
| populada | n/a |
| comentário |  |


```sql
SELECT co.nome_crm AS transportadora,
    co.cnpj,
    co.razao_social,
        CASE
            WHEN co.cnpj IS NOT NULL THEN true
            ELSE false
        END AS tem_cnpj,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM company_phones cp
              WHERE cp.company_id = co.id)) THEN true
            ELSE false
        END AS tem_telefone,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM company_emails ce
              WHERE ce.company_id = co.id)) THEN true
            ELSE false
        END AS tem_email,
    addr.cidade,
    addr.estado,
    ch.status AS ultimo_status,
    ch.motivo_reprovacao,
        CASE
            WHEN ch.id IS NULL THEN 'NUNCA_ANALISADO'::text
            WHEN ch.status = 'pendente'::carrier_homologation_status THEN 'AGUARDANDO_ANALISE'::text
            WHEN ch.status = 'em_analise'::carrier_homologation_status THEN 'EM_ANALISE'::text
            WHEN ch.status = 'reprovado'::carrier_homologation_status THEN 'REPROVADO_PENDENTE_REVISAO'::text
            WHEN ch.status = 'vencido'::carrier_homologation_status THEN 'VENCIDO_RENOVAR'::text
            ELSE 'OUTRO'::text
        END AS acao_necessaria,
        CASE
            WHEN ch.id IS NULL THEN 1
            WHEN ch.status = 'vencido'::carrier_homologation_status THEN 2
            WHEN ch.status = 'pendente'::carrier_homologation_status THEN 3
            WHEN ch.status = 'em_analise'::carrier_homologation_status THEN 4
            WHEN ch.status = 'reprovado'::carrier_homologation_status THEN 5
            ELSE 6
        END AS prioridade_ordem,
    ca.id AS carrier_id,
    ca.company_id
   FROM carriers ca
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
     LEFT JOIN LATERAL ( SELECT ch2.id,
            ch2.carrier_id,
            ch2.status,
            ch2.avaliador_id,
            ch2.data_solicitacao,
            ch2.data_decisao,
            ch2.validade,
            ch2.criterios_checados,
            ch2.motivo_reprovacao,
            ch2.observacoes,
            ch2.created_at,
            ch2.updated_at
           FROM carrier_homologations ch2
          WHERE ch2.carrier_id = ca.id
          ORDER BY ch2.created_at DESC
         LIMIT 1) ch ON true
     LEFT JOIN LATERAL ( SELECT cad.cidade,
            cad.estado
           FROM company_addresses cad
          WHERE cad.company_id = co.id
          ORDER BY cad.is_primary DESC
         LIMIT 1) addr ON true
  WHERE ca.homologado = false
  ORDER BY (
        CASE
            WHEN ch.id IS NULL THEN 1
            WHEN ch.status = 'vencido'::carrier_homologation_status THEN 2
            WHEN ch.status = 'pendente'::carrier_homologation_status THEN 3
            WHEN ch.status = 'em_analise'::carrier_homologation_status THEN 4
            WHEN ch.status = 'reprovado'::carrier_homologation_status THEN 5
            ELSE 6
        END), co.nome_crm;
```

## public.vw_carrier_qualification_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_evaluations, public.carrier_homologations, public.carrier_scores, public.carriers, public.companies |
| populada | n/a |
| comentário | Dashboard gerencial consolidado de transportadoras: totais, segmentos, trends, homologações |


```sql
SELECT count(*) AS total_transportadoras,
    count(*) FILTER (WHERE ca.homologado = true) AS total_homologados,
    count(*) FILTER (WHERE ca.homologado = false) AS total_nao_homologados,
    round(100.0 * count(*) FILTER (WHERE ca.homologado = true)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_homologados,
    count(*) FILTER (WHERE cs.segment_code = 'excelente'::text) AS qtd_excelente,
    count(*) FILTER (WHERE cs.segment_code = 'bom'::text) AS qtd_bom,
    count(*) FILTER (WHERE cs.segment_code = 'regular'::text) AS qtd_regular,
    count(*) FILTER (WHERE cs.segment_code = 'insuficiente'::text) AS qtd_insuficiente,
    count(*) FILTER (WHERE cs.segment_code = 'critico'::text) AS qtd_critico,
    count(*) FILTER (WHERE cs.carrier_id IS NULL) AS qtd_sem_avaliacao,
    round(avg(cs.score_geral), 2) AS score_medio_geral,
    count(*) FILTER (WHERE cs.trend = 'melhorando'::text) AS qtd_melhorando,
    count(*) FILTER (WHERE cs.trend = 'estavel'::text) AS qtd_estavel,
    count(*) FILTER (WHERE cs.trend = 'piorando'::text) AS qtd_piorando,
    count(*) FILTER (WHERE hom.status = 'pendente'::carrier_homologation_status) AS homologacoes_pendentes,
    count(*) FILTER (WHERE hom.status = 'em_analise'::carrier_homologation_status) AS homologacoes_em_analise,
    count(*) FILTER (WHERE hom.validade < CURRENT_DATE) AS homologacoes_vencidas,
    count(*) FILTER (WHERE hom.validade >= CURRENT_DATE AND hom.validade <= (CURRENT_DATE + 30)) AS homologacoes_vencendo_30d,
    COALESCE(sum(cs.total_avaliacoes), 0::bigint) AS total_avaliacoes_realizadas,
    ( SELECT count(*) AS count
           FROM carrier_evaluations
          WHERE carrier_evaluations.data_avaliacao >= (CURRENT_DATE - 30)) AS avaliacoes_ultimos_30d
   FROM carriers ca
     JOIN companies c ON c.id = ca.company_id AND c.deleted_at IS NULL
     LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
     LEFT JOIN LATERAL ( SELECT ch.status,
            ch.validade
           FROM carrier_homologations ch
          WHERE ch.carrier_id = ca.id
          ORDER BY ch.created_at DESC
         LIMIT 1) hom ON true;
```

## public.vw_carrier_ranking (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_qualification_config, public.carrier_scores, public.carriers, public.companies |
| populada | n/a |
| comentário | Ranking de transportadoras por score DESC com cores de segmento |


```sql
SELECT rank() OVER (ORDER BY cs.score_geral DESC NULLS LAST) AS ranking,
    co.nome_crm AS transportadora,
    co.cnpj,
    ca.homologado,
    cs.score_geral,
    cs.score_pontualidade,
    cs.score_conservacao,
    cs.score_preco_frete,
    cs.score_rastreamento,
    cs.score_cobertura,
    cs.classificacao,
    cs.segment_code,
    cs.trend,
    cs.total_avaliacoes,
    cs.ultima_avaliacao,
    cs.score_change,
    cqc.color AS segment_color,
    ca.id AS carrier_id,
    ca.company_id
   FROM carriers ca
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
     LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
     LEFT JOIN carrier_qualification_config cqc ON cqc.segment_code = cs.segment_code
  ORDER BY cs.score_geral DESC NULLS LAST;
```

## public.vw_carriers (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_homologations, public.carrier_scores, public.carriers, public.companies, public.company_addresses, public.company_emails, public.company_phones |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id,
    c.bitrix_company_id,
    c.nome_crm AS title,
    c.cnpj,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    addr.cidade,
    addr.estado,
    ca2.tipo_transporte,
    ca2.homologado,
    ca2.data_homologacao,
    ca2.score_geral,
    cs.classificacao,
    cs.segment_code,
    cs.trend,
    cs.total_avaliacoes,
    cs.ultima_avaliacao,
    hom.status AS homologation_status,
    hom.validade AS homologation_validade,
    c.created_at
   FROM companies c
     JOIN carriers ca2 ON ca2.company_id = c.id
     LEFT JOIN carrier_scores cs ON cs.carrier_id = ca2.id
     LEFT JOIN LATERAL ( SELECT ch.status,
            ch.validade
           FROM carrier_homologations ch
          WHERE ch.carrier_id = ca2.id
          ORDER BY ch.created_at DESC
         LIMIT 1) hom ON true
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE c.deleted_at IS NULL AND c.is_carrier = true;
```

## public.vw_carriers_completo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.carrier_homologations, public.carrier_scores, public.carriers, public.companies, public.company_addresses, public.company_emails, public.company_phones, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT ca.id,
    ca.company_id,
    ca.tipo_transporte,
    ca.grupo_economico,
    ca.estados_atendidos,
    ca.cidades_atendidas,
    ca.prazo_por_trecho,
    ca.tipo_frete,
    ca.tabela_frete,
    ca.homologado,
    ca.data_homologacao,
    ca.score_geral,
    ca.created_at,
    ca.updated_at,
    co.razao_social,
    co.nome_fantasia,
    co.nome_crm AS company_title,
    co.cnpj,
    co.status AS company_status,
    co.situacao_rf,
    co.porte_rf,
    co.capital_social,
    cs.score_pontualidade,
    cs.score_conservacao,
    cs.score_preco_frete,
    cs.score_rastreamento,
    cs.score_cobertura,
    cs.classificacao,
    cs.segment_code,
    cs.trend,
    cs.total_avaliacoes,
    cs.ultima_avaliacao,
    cs.previous_score,
    cs.score_change,
    hom.homologation_id,
    hom.homologation_status,
    hom.homologation_validade,
    hom.homologation_avaliador,
    hom.homologation_data_decisao,
    phone.numero AS telefone_principal,
    email.email AS email_principal,
    addr.cidade,
    addr.estado
   FROM carriers ca
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
     LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
     LEFT JOIN LATERAL ( SELECT ch.id AS homologation_id,
            ch.status AS homologation_status,
            ch.validade AS homologation_validade,
            u.name AS homologation_avaliador,
            ch.data_decisao AS homologation_data_decisao
           FROM carrier_homologations ch
             LEFT JOIN users u ON u.id = ch.avaliador_id
          WHERE ch.carrier_id = ca.id
          ORDER BY ch.created_at DESC
         LIMIT 1) hom ON true
     LEFT JOIN LATERAL ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = co.id AND cp.is_primary = true
         LIMIT 1) phone ON true
     LEFT JOIN LATERAL ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = co.id AND ce.is_primary = true
         LIMIT 1) email ON true
     LEFT JOIN LATERAL ( SELECT cad.cidade,
            cad.estado
           FROM company_addresses cad
          WHERE cad.company_id = co.id
          ORDER BY cad.is_primary DESC
         LIMIT 1) addr ON true;
```

## public.vw_carteira_sdr (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_emails, public.company_phones, public.customers, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT cust.sdr_id,
    cust.sdr_nome,
    cust.company_id,
    c.nome_crm AS empresa,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    cust.id AS customer_id,
        CASE
            WHEN cust.ja_comprou = true THEN 'COMPRADOR'::text
            ELSE 'PROSPECT'::text
        END AS tipo_cliente,
    cust.vendedor_id AS ultimo_closer_id,
    cust.vendedor_nome AS ultimo_closer_nome,
    cust.data_ultima_compra,
    cust.data_atribuicao_sdr,
    EXTRACT(day FROM now() - cust.data_atribuicao_sdr::timestamp with time zone)::integer AS dias_com_sdr,
    (( SELECT count(*) AS count
           FROM interactions i
          WHERE i.company_id = c.id AND i.direction = 'outbound'::text))::integer AS qtd_tentativas_contato,
    (( SELECT count(*) AS count
           FROM interactions i
          WHERE i.company_id = c.id))::integer AS qtd_conversas
   FROM customers cust
     JOIN companies c ON c.id = cust.company_id
  WHERE c.deleted_at IS NULL AND cust.deleted_at IS NULL AND cust.sdr_id IS NOT NULL;
```

## public.vw_carteira_vendedores (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT cu.vendedor_id,
    u.name AS vendedor_nome,
    count(*) AS total_clientes,
    sum(
        CASE
            WHEN cu.cliente_ativado AND cu.ja_comprou THEN 1
            ELSE 0
        END) AS clientes_ativos,
    sum(
        CASE
            WHEN NOT cu.cliente_ativado AND cu.ja_comprou THEN 1
            ELSE 0
        END) AS ex_clientes,
    sum(
        CASE
            WHEN NOT cu.ja_comprou THEN 1
            ELSE 0
        END) AS prospects
   FROM customers cu
     JOIN users u ON cu.vendedor_id = u.id
  WHERE cu.vendedor_id IS NOT NULL
  GROUP BY cu.vendedor_id, u.name
  ORDER BY (count(*)) DESC;
```

## public.vw_churn_risk_ranking (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.interaction_participants, _dormant.user_contacts_link, public.churn_predictions, public.companies, public.contact_emails, public.contacts, public.interactions, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    co.ramo_atividade AS segment,
    p.full_name AS owner_name,
    cp.churn_probability,
    cp.confidence_level,
    cp.risk_level,
    cp.risk_factors,
    cp.recommended_actions,
    rank() OVER (ORDER BY cp.churn_probability DESC NULLS LAST) AS churn_ranking,
    c.relationship_score,
    ( SELECT count(*) AS count
           FROM interactions i
          WHERE i.contact_id = c.id AND i.created_at > (now() - '30 days'::interval)) AS interactions_30d,
    ( SELECT max(i.created_at) AS max
           FROM interactions i
          WHERE i.contact_id = c.id) AS last_interaction,
    EXTRACT(day FROM now() - (( SELECT max(i.created_at) AS max
           FROM interactions i
          WHERE i.contact_id = c.id)))::integer AS days_since_contact,
        CASE
            WHEN cp.churn_probability >= 80::numeric THEN '🚨 CRÍTICO: Ação imediata necessária!'::text
            WHEN cp.churn_probability >= 60::numeric THEN '⚠️ ALTO: Risco elevado de perda'::text
            WHEN cp.churn_probability >= 40::numeric THEN '⚡ MÉDIO: Monitorar de perto'::text
            ELSE '✅ BAIXO: Cliente estável'::text
        END AS alert_message
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN user_contacts_link ucl ON c.id = ucl.contact_id
     LEFT JOIN profiles p ON ucl.user_id = p.id
     LEFT JOIN churn_predictions cp ON c.id = cp.contact_id AND cp.is_current = true
  WHERE cp.churn_probability IS NOT NULL
  ORDER BY cp.churn_probability DESC;
```

## public.vw_cliente_completo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.company_emails, public.company_phones, public.customers |
| populada | n/a |
| comentário |  |


```sql
SELECT cust.id AS customer_id,
    cust.company_id,
    c.nome_crm AS empresa,
    c.razao_social,
    c.nome_fantasia,
    c.cnpj,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS telefone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    addr.cidade,
    addr.estado,
    cust.cliente_ativado,
    cust.ja_comprou,
    cust.vendedor_id,
    cust.vendedor_nome,
    cust.sdr_id,
    cust.sdr_nome,
    cust.data_ativacao,
    cust.ativado_por,
    cust.data_inativacao,
    cust.inativado_por_nome,
    cust.motivo_inativacao,
    cust.data_primeira_compra,
    cust.data_ultima_compra,
    cust.total_pedidos,
    cust.valor_total_compras,
    cust.ticket_medio,
    cust.data_entrada_carteira,
    cust.primeiro_ativador_nome,
    cust.data_primeira_ativacao,
        CASE
            WHEN cust.cliente_ativado = false THEN 'INATIVO'::text
            WHEN cust.ja_comprou = false THEN 'PROSPECT'::text
            ELSE 'ATIVO'::text
        END AS status_cliente,
        CASE
            WHEN cust.data_ultima_compra IS NOT NULL THEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone)::integer
            ELSE NULL::integer
        END AS dias_sem_compra,
    cust.created_at,
    cust.updated_at
   FROM customers cust
     JOIN companies c ON c.id = cust.company_id
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE c.deleted_at IS NULL AND cust.deleted_at IS NULL;
```

## public.vw_clientes_prioridade (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.company_emails, public.company_phones, public.customers |
| populada | n/a |
| comentário |  |


```sql
SELECT cust.id AS customer_id,
    cust.company_id,
    c.nome_crm AS empresa,
    c.cnpj,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    addr.cidade,
    addr.estado,
    cust.cliente_ativado,
    cust.ja_comprou,
    cust.vendedor_id,
    cust.vendedor_nome,
    cust.data_ultima_compra,
    cust.valor_total_compras,
    cust.total_pedidos,
    EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone)::integer AS dias_sem_compra,
        CASE
            WHEN cust.data_ultima_compra IS NULL THEN 0
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 180::numeric THEN 1
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 120::numeric THEN 2
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 90::numeric THEN 3
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 60::numeric THEN 4
            ELSE 5
        END AS nivel_prioridade,
        CASE
            WHEN cust.data_ultima_compra IS NULL THEN 'Sem compras'::text
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 180::numeric THEN 'PARA INATIVAR'::text
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 120::numeric THEN 'RISCO ALTO'::text
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 90::numeric THEN 'RISCO MEDIO'::text
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 60::numeric THEN 'ATENCAO'::text
            ELSE 'OK'::text
        END AS status_prioridade,
        CASE
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 180::numeric THEN 'Ligar URGENTE ou inativar'::text
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 120::numeric THEN 'Ligar para reativacao'::text
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 90::numeric THEN 'Enviar proposta / followup'::text
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 60::numeric THEN 'Agendar contato'::text
            ELSE 'Manter relacionamento'::text
        END AS acao_sugerida
   FROM customers cust
     JOIN companies c ON c.id = cust.company_id
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE c.deleted_at IS NULL AND cust.deleted_at IS NULL AND cust.cliente_ativado = true AND cust.ja_comprou = true
  ORDER BY (
        CASE
            WHEN cust.data_ultima_compra IS NULL THEN 0
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 180::numeric THEN 1
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 120::numeric THEN 2
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 90::numeric THEN 3
            WHEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone) >= 60::numeric THEN 4
            ELSE 5
        END), (EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone)::integer) DESC;
```

## public.vw_closing_score_alerts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_emails, public.contacts, public.interactions, public.relationship_score_history |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    rsh.score AS closing_score,
    rsh.previous_score,
    rsh.score - COALESCE(rsh.previous_score, 0) AS score_change,
    rsh.measured_at,
        CASE
            WHEN rsh.score >= 80 THEN 'HOT 🔥'::text
            WHEN rsh.score >= 60 THEN 'WARM 🌡️'::text
            WHEN rsh.score >= 40 THEN 'COOL 💨'::text
            ELSE 'COLD ❄️'::text
        END AS temperature,
        CASE
            WHEN rsh.score >= 80 THEN 'AÇÃO IMEDIATA: Cliente pronto para fechar!'::text
            WHEN rsh.score >= 60 AND (rsh.score - COALESCE(rsh.previous_score, 0)) > 10 THEN 'ATENÇÃO: Score subindo'::text
            WHEN rsh.score < 40 AND COALESCE(rsh.previous_score, 0) >= 40 THEN 'ALERTA: Score caindo'::text
            WHEN rsh.score >= 60 THEN 'ACOMPANHAR: Manter relacionamento'::text
            ELSE 'NUTRIR: Precisa engajamento'::text
        END AS action_alert,
    EXTRACT(day FROM now() - (( SELECT max(i.created_at) AS max
           FROM interactions i
          WHERE i.contact_id = c.id)))::integer AS days_since_last_contact,
        CASE
            WHEN rsh.score >= 80 THEN 1
            WHEN rsh.score >= 60 AND (rsh.score - COALESCE(rsh.previous_score, 0)) > 10 THEN 2
            WHEN rsh.score < 40 AND COALESCE(rsh.previous_score, 0) >= 40 THEN 2
            WHEN rsh.score >= 60 THEN 3
            ELSE 4
        END AS priority
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN LATERAL ( SELECT relationship_score_history.score,
            relationship_score_history.previous_score,
            relationship_score_history.measured_at
           FROM relationship_score_history
          WHERE relationship_score_history.contact_id = c.id
          ORDER BY relationship_score_history.measured_at DESC
         LIMIT 1) rsh ON true
  WHERE rsh.score IS NOT NULL
  ORDER BY (
        CASE
            WHEN rsh.score >= 80 THEN 1
            WHEN rsh.score >= 60 AND (rsh.score - COALESCE(rsh.previous_score, 0)) > 10 THEN 2
            WHEN rsh.score < 40 AND COALESCE(rsh.previous_score, 0) >= 40 THEN 2
            WHEN rsh.score >= 60 THEN 3
            ELSE 4
        END), rsh.score DESC;
```

## public.vw_closing_score_ranking (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.disc_assessments, _dormant.user_contacts_link, _dormant.vak_profiles, public.companies, public.contact_emails, public.contacts, public.interactions, public.profiles, public.relationship_score_history |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social, co.nome_fantasia) AS company_name,
    co.ramo_atividade AS segment,
    p.full_name AS owner_name,
    rsh.score AS closing_score,
    rsh.measured_at AS score_date,
    rank() OVER (ORDER BY rsh.score DESC NULLS LAST) AS ranking_geral,
    rank() OVER (PARTITION BY co.ramo_atividade ORDER BY rsh.score DESC NULLS LAST) AS ranking_segmento,
    ( SELECT count(*) AS count
           FROM interactions i
          WHERE i.contact_id = c.id AND i.created_at > (now() - '30 days'::interval)) AS interactions_30d,
    ( SELECT max(i.created_at) AS max
           FROM interactions i
          WHERE i.contact_id = c.id) AS last_interaction,
    da.primary_profile AS disc_type,
    vak.visual_score,
    vak.auditory_score,
    vak.kinesthetic_score
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN user_contacts_link ucl ON c.id = ucl.contact_id
     LEFT JOIN profiles p ON ucl.user_id = p.id
     LEFT JOIN LATERAL ( SELECT relationship_score_history.score,
            relationship_score_history.measured_at
           FROM relationship_score_history
          WHERE relationship_score_history.contact_id = c.id
          ORDER BY relationship_score_history.measured_at DESC
         LIMIT 1) rsh ON true
     LEFT JOIN disc_assessments da ON c.id = da.contact_id AND (da.is_current = true OR da.is_current IS NULL)
     LEFT JOIN vak_profiles vak ON c.id = vak.contact_id
  WHERE rsh.score IS NOT NULL
  ORDER BY rsh.score DESC;
```

## public.vw_communication_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.contact_communication_style, _dormant.contact_eq_scores, _dormant.disc_assessments, _dormant.rapport_score_history, _dormant.shared_interests, _dormant.vak_profiles, public.companies, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    da.primary_profile AS disc_type,
    vp.primary_modality AS vak_type,
    eq.eq_level,
    ccs.pace,
    ccs.tone,
    ccs.decision_style,
    rsh.rapport_score,
    rsh.rapport_level,
    ( SELECT count(*) AS count
           FROM shared_interests si
          WHERE si.contact_id = c.id AND si.is_active = true) AS interests_count,
        CASE
            WHEN da.primary_profile = 'D'::text THEN 'Direto, focado em resultados'::text
            WHEN da.primary_profile = 'I'::text THEN 'Entusiasta, social'::text
            WHEN da.primary_profile = 'S'::text THEN 'Paciente, construa confiança'::text
            WHEN da.primary_profile = 'C'::text THEN 'Detalhado, dados e fatos'::text
            ELSE 'Adaptar conforme resposta'::text
        END AS approach_summary,
        CASE
            WHEN rsh.rapport_level::text = ANY (ARRAY['weak'::character varying::text, 'none'::character varying::text]) THEN '🎯 Priorizar rapport'::text
            WHEN eq.eq_level::text = 'very_low'::text THEN '⚠️ Comunicação cuidadosa'::text
            WHEN ccs.pace::text = 'fast'::text THEN '⚡ Ser objetivo'::text
            ELSE '✅ Seguir perfil'::text
        END AS communication_action
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN disc_assessments da ON c.id = da.contact_id AND da.is_current = true
     LEFT JOIN vak_profiles vp ON c.id = vp.contact_id
     LEFT JOIN contact_eq_scores eq ON c.id = eq.contact_id AND eq.is_current = true
     LEFT JOIN contact_communication_style ccs ON c.id = ccs.contact_id AND ccs.is_current = true
     LEFT JOIN rapport_score_history rsh ON c.id = rsh.contact_id AND rsh.is_current = true
  ORDER BY rsh.rapport_score NULLS FIRST;
```

## public.vw_companies_completo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.company_emails, public.company_phones, public.contacts, public.grupos_economicos |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id,
    c.nome_crm AS title,
    c.razao_social,
    c.nome_fantasia,
    c.cnpj,
    c.status,
    c.tipo_cooperativa,
    c.is_customer,
    c.is_supplier,
    c.is_carrier,
    ge.nome AS grupo_economico,
    ge.tipo AS tipo_grupo,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS telefone_principal,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email_principal,
    addr.cidade,
    addr.estado,
    addr.cep,
    (( SELECT count(*) AS count
           FROM contacts ct
          WHERE ct.company_id = c.id AND ct.deleted_at IS NULL))::integer AS total_contacts,
    (( SELECT count(*) AS count
           FROM company_phones cp
          WHERE cp.company_id = c.id))::integer AS total_phones,
    (( SELECT count(*) AS count
           FROM company_emails ce
          WHERE ce.company_id = c.id))::integer AS total_emails,
    c.created_at,
    c.updated_at
   FROM companies c
     LEFT JOIN grupos_economicos ge ON ge.id = c.grupo_economico_id
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado,
            ca.cep
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE c.deleted_at IS NULL;
```

## public.vw_companies_contato (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_emails, public.company_phones |
| populada | n/a |
| comentário | Substitui companies.phone/email. Fonte: company_phones e company_emails. |


```sql
SELECT co.id,
    co.nome_crm AS title,
    co.razao_social,
    co.cnpj,
    cp_primary.numero AS phone,
    cp_primary.numero_normalizado AS phone_normalizado,
    cp_primary.is_whatsapp AS phone_is_whatsapp,
    cp_secondary.numero AS phone_secondary,
    cp_whatsapp.numero AS whatsapp,
    ce_primary.email,
    ce_primary.email_normalizado,
    ( SELECT count(*) AS count
           FROM company_phones cpx
          WHERE cpx.company_id = co.id) AS total_telefones,
    ( SELECT count(*) AS count
           FROM company_emails cex
          WHERE cex.company_id = co.id) AS total_emails
   FROM companies co
     LEFT JOIN LATERAL ( SELECT cp.numero,
            cp.numero_normalizado,
            cp.is_whatsapp
           FROM company_phones cp
          WHERE cp.company_id = co.id AND cp.is_primary = true
          ORDER BY cp.updated_at DESC
         LIMIT 1) cp_primary ON true
     LEFT JOIN LATERAL ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = co.id AND cp.is_primary = false
          ORDER BY cp.is_whatsapp DESC, cp.created_at DESC
         LIMIT 1) cp_secondary ON true
     LEFT JOIN LATERAL ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = co.id AND cp.is_whatsapp = true
          ORDER BY cp.is_primary DESC
         LIMIT 1) cp_whatsapp ON true
     LEFT JOIN LATERAL ( SELECT ce.email,
            ce.email_normalizado
           FROM company_emails ce
          WHERE ce.company_id = co.id AND ce.is_primary = true
          ORDER BY ce.created_at DESC
         LIMIT 1) ce_primary ON true;
```

## public.vw_companies_cores (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies |
| populada | n/a |
| comentário | Empresas que possuem cores de marca cadastradas. Para dashboards e cruzamento com produtos. |


```sql
SELECT id,
    nome_crm AS title,
    cnpj,
    logo_url,
    cores_marca,
    status,
    is_customer,
    is_supplier,
    is_carrier
   FROM companies c
  WHERE cores_marca IS NOT NULL AND array_length(cores_marca, 1) > 0 AND deleted_at IS NULL;
```

## public.vw_companies_duplicatas (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_emails, public.company_phones, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id,
    c.razao_social,
    c.nome_crm AS title,
    c.cnpj,
    c.is_customer,
    c.is_supplier,
    c.is_carrier,
    c.grupo_economico_id,
    c.created_at,
    ( SELECT count(*) AS count
           FROM contacts ct
          WHERE ct.company_id = c.id AND ct.deleted_at IS NULL) AS total_contacts,
    ( SELECT count(*) AS count
           FROM company_phones cp
          WHERE cp.company_id = c.id) AS total_phones,
    ( SELECT count(*) AS count
           FROM company_emails ce
          WHERE ce.company_id = c.id) AS total_emails,
    dup.qtd AS duplicatas_count,
        CASE
            WHEN c.created_at = (( SELECT min(c2.created_at) AS min
               FROM companies c2
              WHERE upper(TRIM(BOTH FROM c2.razao_social)) = upper(TRIM(BOTH FROM c.razao_social)))) THEN true
            ELSE false
        END AS is_master
   FROM companies c
     JOIN ( SELECT upper(TRIM(BOTH FROM companies.razao_social)) AS rs,
            count(*) AS qtd
           FROM companies
          WHERE companies.razao_social IS NOT NULL AND companies.razao_social <> ''::text
          GROUP BY (upper(TRIM(BOTH FROM companies.razao_social)))
         HAVING count(*) > 1) dup ON upper(TRIM(BOTH FROM c.razao_social)) = dup.rs
  ORDER BY dup.qtd DESC, c.razao_social, c.created_at;
```

## public.vw_companies_stats (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_emails, public.company_phones, public.contacts, public.customers, public.grupos_economicos, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id,
    c.nome_crm AS title,
    c.razao_social,
    c.nome_fantasia,
    c.cnpj,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    ( SELECT ce.email_normalizado
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email_normalized,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    c.status,
    c.is_customer,
    c.is_supplier,
    c.is_carrier,
    c.created_at,
    c.grupo_economico_id,
    ge.nome AS grupo_economico_nome,
    ge.tipo AS grupo_economico_tipo,
    cust.cliente_ativado,
    cust.ja_comprou,
    cust.valor_total_compras,
    cust.ticket_medio,
    cust.data_primeira_compra,
    cust.data_ultima_compra,
    cust.total_pedidos,
    cust.vendedor_id,
    cust.vendedor_nome,
    (( SELECT count(*) AS count
           FROM contacts ct
          WHERE ct.company_id = c.id AND ct.deleted_at IS NULL))::integer AS total_contatos,
    (( SELECT count(*) AS count
           FROM interactions i
          WHERE i.company_id = c.id))::integer AS total_interacoes,
    ( SELECT max(i.created_at) AS max
           FROM interactions i
          WHERE i.company_id = c.id) AS ultima_interacao
   FROM companies c
     LEFT JOIN grupos_economicos ge ON ge.id = c.grupo_economico_id
     LEFT JOIN customers cust ON cust.company_id = c.id AND cust.deleted_at IS NULL
  WHERE c.deleted_at IS NULL;
```

## public.vw_company_addresses (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses |
| populada | n/a |
| comentário |  |


```sql
SELECT ca.id AS address_id,
    ca.company_id,
    c.nome_crm AS empresa_nome,
    c.razao_social,
    ca.tipo,
    ca.is_primary,
    ca.cep,
    ca.logradouro,
    ca.numero,
    ca.complemento,
    ca.bairro,
    ca.cidade,
    ca.estado,
    ca.pais,
    ca.latitude,
    ca.longitude,
    ca.ponto_referencia,
    ca.instrucoes_entrega,
    concat_ws(', '::text, NULLIF(concat_ws(' '::text, ca.logradouro, ca.numero), ''::text), ca.complemento, ca.bairro, concat_ws(' - '::text, ca.cidade, ca.estado), ca.cep) AS endereco_formatado,
    ca.created_at,
    ca.updated_at
   FROM company_addresses ca
     JOIN companies c ON c.id = ca.company_id
  WHERE c.deleted_at IS NULL
  ORDER BY ca.company_id, ca.is_primary DESC, ca.tipo;
```

## public.vw_company_social_media (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_social_media |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS company_id,
    c.nome_fantasia,
    c.razao_social,
    c.status AS company_status,
    max(
        CASE
            WHEN csm.plataforma = 'linkedin'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS linkedin_url,
    max(
        CASE
            WHEN csm.plataforma = 'linkedin'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS linkedin_handle,
    max(
        CASE
            WHEN csm.plataforma = 'instagram'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS instagram_url,
    max(
        CASE
            WHEN csm.plataforma = 'instagram'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS instagram_handle,
    max(
        CASE
            WHEN csm.plataforma = 'facebook'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS facebook_url,
    max(
        CASE
            WHEN csm.plataforma = 'facebook'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS facebook_handle,
    max(
        CASE
            WHEN csm.plataforma = 'x'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS x_url,
    max(
        CASE
            WHEN csm.plataforma = 'x'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS x_handle,
    count(csm.id) AS total_redes_cadastradas
   FROM companies c
     LEFT JOIN company_social_media csm ON csm.company_id = c.id AND csm.is_active = true
  WHERE c.deleted_at IS NULL
  GROUP BY c.id, c.nome_fantasia, c.razao_social, c.status;
```

## public.vw_contact_social_media (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_social_media, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT ct.id AS contact_id,
    ct.full_name,
    ct.cargo,
    ct.company_id,
    co.nome_fantasia AS empresa,
    max(
        CASE
            WHEN csm.plataforma = 'linkedin'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS linkedin_url,
    max(
        CASE
            WHEN csm.plataforma = 'linkedin'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS linkedin_handle,
    max(
        CASE
            WHEN csm.plataforma = 'instagram'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS instagram_url,
    max(
        CASE
            WHEN csm.plataforma = 'instagram'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS instagram_handle,
    max(
        CASE
            WHEN csm.plataforma = 'facebook'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS facebook_url,
    max(
        CASE
            WHEN csm.plataforma = 'facebook'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS facebook_handle,
    max(
        CASE
            WHEN csm.plataforma = 'x'::social_media_platform THEN csm.url::text
            ELSE NULL::text
        END) AS x_url,
    max(
        CASE
            WHEN csm.plataforma = 'x'::social_media_platform THEN csm.handle::text
            ELSE NULL::text
        END) AS x_handle,
    count(csm.id) AS total_redes_cadastradas
   FROM contacts ct
     LEFT JOIN contact_social_media csm ON csm.contact_id = ct.id AND csm.is_active = true
     LEFT JOIN companies co ON co.id = ct.company_id
  WHERE ct.deleted_at IS NULL
  GROUP BY ct.id, ct.full_name, ct.cargo, ct.company_id, co.nome_fantasia;
```

## public.vw_contacts_completo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_emails, public.contact_phones, public.contacts, public.grupos_economicos |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id,
    c.full_name,
    c.first_name,
    c.last_name,
    c.nome_tratamento,
    c.assinatura_contato,
    c.apelido,
    c.cargo,
    c.sexo,
    c.relationship_stage,
    c.is_duplicate,
    c.company_id,
    co.nome_crm AS company_title,
    co.razao_social AS company_razao,
    co.tipo_cooperativa,
    g.nome AS grupo_economico,
    ( SELECT cp.numero_normalizado
           FROM contact_phones cp
          WHERE cp.contact_id = c.id AND cp.is_primary = true
         LIMIT 1) AS telefone_principal,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email_principal,
    ( SELECT count(*) AS count
           FROM contact_phones cp
          WHERE cp.contact_id = c.id) AS total_phones,
    ( SELECT count(*) AS count
           FROM contact_emails ce
          WHERE ce.contact_id = c.id) AS total_emails,
    c.created_at,
    c.updated_at
   FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     LEFT JOIN grupos_economicos g ON g.id = co.grupo_economico_id
  WHERE c.deleted_at IS NULL;
```

## public.vw_contacts_contato (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.contact_emails, public.contact_phones, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT ct.id,
    ct.full_name,
    ct.nome_tratamento,
    ct.apelido,
    ct.company_id,
    cp_primary.numero_normalizado AS phone,
    cp_primary.numero_normalizado AS phone_normalizado,
    cp_whatsapp.numero_normalizado AS whatsapp,
    ce_primary.email,
    ce_primary.email_normalizado,
    ( SELECT count(*) AS count
           FROM contact_phones cpx
          WHERE cpx.contact_id = ct.id) AS total_telefones,
    ( SELECT count(*) AS count
           FROM contact_emails cex
          WHERE cex.contact_id = ct.id) AS total_emails
   FROM contacts ct
     LEFT JOIN LATERAL ( SELECT cp.numero_normalizado
           FROM contact_phones cp
          WHERE cp.contact_id = ct.id AND cp.is_primary = true
          ORDER BY cp.updated_at DESC
         LIMIT 1) cp_primary ON true
     LEFT JOIN LATERAL ( SELECT cp.numero_normalizado
           FROM contact_phones cp
          WHERE cp.contact_id = ct.id AND cp.is_whatsapp = true
          ORDER BY cp.is_primary DESC
         LIMIT 1) cp_whatsapp ON true
     LEFT JOIN LATERAL ( SELECT ce.email,
            ce.email_normalizado
           FROM contact_emails ce
          WHERE ce.contact_id = ct.id AND ce.is_primary = true
          ORDER BY ce.created_at DESC
         LIMIT 1) ce_primary ON true
  WHERE ct.deleted_at IS NULL;
```

## public.vw_contacts_full (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_emails, public.company_phones, public.contact_emails, public.contact_phones, public.contacts, public.grupos_economicos |
| populada | n/a |
| comentário |  |


```sql
SELECT ct.id,
    ct.full_name,
    ct.first_name,
    ct.last_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = ct.id AND ce.is_primary = true
         LIMIT 1) AS email,
    ( SELECT ce.email_normalizado
           FROM contact_emails ce
          WHERE ce.contact_id = ct.id AND ce.is_primary = true
         LIMIT 1) AS email_normalized,
    ( SELECT cp.numero_normalizado
           FROM contact_phones cp
          WHERE cp.contact_id = ct.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ct.cargo,
    ct.is_duplicate,
    ct.created_at,
    ct.updated_at,
    ct.company_id,
    c.nome_crm AS empresa_nome,
    c.razao_social AS empresa_razao_social,
    c.nome_fantasia AS empresa_nome_fantasia,
    c.cnpj AS empresa_cnpj,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS empresa_phone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS empresa_email,
    c.status AS empresa_status,
    c.is_customer AS empresa_is_cliente,
    c.grupo_economico_id,
    ge.nome AS grupo_economico_nome,
        CASE
            WHEN ct.deleted_at IS NULL THEN true
            ELSE false
        END AS is_active
   FROM contacts ct
     LEFT JOIN companies c ON c.id = ct.company_id
     LEFT JOIN grupos_economicos ge ON ge.id = c.grupo_economico_id
  WHERE ct.deleted_at IS NULL;
```

## public.vw_contacts_sem_apelido (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.contact_emails, public.contact_phones, public.contacts, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT ct.id AS contact_id,
    ct.full_name,
    ct.first_name,
    ct.nome_tratamento,
    ct.apelido,
    ct.cargo,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = ct.id AND ce.is_primary = true
         LIMIT 1) AS email,
    ( SELECT cp.numero_normalizado
           FROM contact_phones cp
          WHERE cp.contact_id = ct.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ct.company_id,
    c.nome_crm AS empresa,
    addr.cidade,
    (( SELECT count(*) AS count
           FROM interactions i
          WHERE i.contact_id = ct.id AND i.user_id = auth.uid()))::integer AS total_interacoes,
    COALESCE(( SELECT max(i.created_at) AS max
           FROM interactions i
          WHERE i.contact_id = ct.id AND i.user_id = auth.uid()), ct.updated_at) AS ultima_interacao,
        CASE
            WHEN ct.apelido IS NOT NULL THEN 'OK'::text
            WHEN (EXISTS ( SELECT 1
               FROM interactions i
              WHERE i.contact_id = ct.id AND i.user_id = auth.uid())) THEN 'ALTA'::text
            WHEN ct.company_id IS NOT NULL THEN 'MEDIA'::text
            ELSE 'BAIXA'::text
        END AS prioridade_preenchimento
   FROM contacts ct
     LEFT JOIN companies c ON c.id = ct.company_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL
     LEFT JOIN LATERAL ( SELECT ca.cidade
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE ct.user_id = auth.uid() AND ct.deleted_at IS NULL AND ct.apelido IS NULL;
```

## public.vw_cooperativas_estrutura (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.grupos_economicos |
| populada | n/a |
| comentário |  |


```sql
WITH centrais AS (
         SELECT co.id,
            co.nome_crm AS title,
            ge.nome AS grupo,
            co.grupo_economico_id
           FROM companies co
             LEFT JOIN grupos_economicos ge ON co.grupo_economico_id = ge.id
          WHERE co.tipo_cooperativa = 'CENTRAL'::text
        ), singulares AS (
         SELECT co.id,
            co.nome_crm AS title,
            co.central_id,
            ce.nome_crm AS central_nome
           FROM companies co
             LEFT JOIN companies ce ON co.central_id = ce.id
          WHERE co.tipo_cooperativa = 'SINGULAR'::text
        ), pacs AS (
         SELECT co.id,
            co.nome_crm AS title,
            co.singular_id,
            si.nome_crm AS singular_nome,
            co.central_id,
            ce.nome_crm AS central_nome
           FROM companies co
             LEFT JOIN companies si ON co.singular_id = si.id
             LEFT JOIN companies ce ON co.central_id = ce.id
          WHERE co.tipo_cooperativa = 'PAC'::text
        )
 SELECT 'CENTRAL'::text AS nivel,
    c.grupo AS grupo_economico,
    c.title AS central,
    NULL::text AS singular,
    NULL::text AS pac,
    c.id AS company_id
   FROM centrais c
UNION ALL
 SELECT 'SINGULAR'::text AS nivel,
    ge.nome AS grupo_economico,
    s.central_nome AS central,
    s.title AS singular,
    NULL::text AS pac,
    s.id AS company_id
   FROM singulares s
     LEFT JOIN companies co ON s.id = co.id
     LEFT JOIN grupos_economicos ge ON co.grupo_economico_id = ge.id
UNION ALL
 SELECT 'PAC'::text AS nivel,
    ge.nome AS grupo_economico,
    p.central_nome AS central,
    p.singular_nome AS singular,
    p.title AS pac,
    p.id AS company_id
   FROM pacs p
     LEFT JOIN companies co ON p.id = co.id
     LEFT JOIN grupos_economicos ge ON co.grupo_economico_id = ge.id
  ORDER BY 2, 3, 4, 5;
```

## public.vw_customers (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.company_emails, public.company_phones, public.customers |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id,
    c.bitrix_company_id,
    c.nome_crm AS title,
    c.cnpj,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ( SELECT ce.email
           FROM company_emails ce
          WHERE ce.company_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    addr.cidade,
    addr.estado,
    c.status,
    cust.grupo_clientes,
    cust.cliente_ativado,
    cust.ja_comprou,
    cust.vendedor_id,
    cust.vendedor_nome,
    c.created_at
   FROM companies c
     JOIN customers cust ON cust.company_id = c.id AND cust.deleted_at IS NULL
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE c.deleted_at IS NULL AND c.is_customer = true;
```

## public.vw_customers_ativos (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customers |
| populada | n/a |
| comentário |  |


```sql
SELECT cu.id,
    cu.company_id,
    cu.ramo_atividade,
    cu.grupo_clientes,
    cu.tipo_cooperativa,
    cu.perfil_preco,
    cu.perfil_qualidade,
    cu.perfil_prazo,
    cu.poder_compra,
    cu.cliente_ativado,
    cu.ja_comprou,
    cu.vendedor_id,
    cu.data_entrada_carteira,
    cu.observacoes,
    cu.sobre,
    cu.spa_data,
    cu.created_at,
    cu.updated_at,
    cu.data_primeira_compra,
    cu.data_ultima_compra,
    cu.total_pedidos,
    cu.valor_total_compras,
    cu.sdr_id,
    cu.data_atribuicao_sdr,
    cu.vendedor_nome,
    cu.sdr_nome,
    cu.data_ativacao,
    cu.ativado_por,
    cu.primeiro_ativador_id,
    cu.primeiro_ativador_nome,
    cu.data_primeira_ativacao,
    cu.data_inativacao,
    cu.inativado_por_id,
    cu.inativado_por_nome,
    cu.motivo_inativacao,
    cu.ticket_medio,
    cu.deleted_at,
    co.razao_social,
    co.nome_crm AS company_title,
    co.cnpj,
    co.status AS company_status,
    co.tipo_cooperativa AS company_tipo_cooperativa,
    co.grupo_economico_id
   FROM customers cu
     JOIN companies co ON co.id = cu.company_id
  WHERE cu.deleted_at IS NULL AND (cu.cliente_ativado = true OR cu.ja_comprou = true OR cu.vendedor_id IS NOT NULL OR cu.total_pedidos > 0 OR cu.valor_total_compras > 0::numeric);
```

## public.vw_customers_completo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_phones, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT cust.id,
    cust.company_id,
    cust.ramo_atividade,
    cust.grupo_clientes,
    cust.tipo_cooperativa,
    cust.perfil_preco,
    cust.perfil_qualidade,
    cust.perfil_prazo,
    cust.poder_compra,
    cust.cliente_ativado,
    cust.ja_comprou,
    cust.vendedor_id,
    cust.data_entrada_carteira,
    cust.observacoes,
    cust.sobre,
    cust.spa_data,
    cust.created_at,
    cust.updated_at,
    cust.data_primeira_compra,
    cust.data_ultima_compra,
    cust.total_pedidos,
    cust.valor_total_compras,
    cust.sdr_id,
    cust.data_atribuicao_sdr,
    cust.vendedor_nome,
    cust.sdr_nome,
    cust.data_ativacao,
    cust.ativado_por,
    cust.primeiro_ativador_id,
    cust.primeiro_ativador_nome,
    cust.data_primeira_ativacao,
    cust.data_inativacao,
    cust.inativado_por_id,
    cust.inativado_por_nome,
    cust.motivo_inativacao,
    cust.ticket_medio,
    cust.deleted_at,
    uv.name AS vendedor_nome_calculado,
    uv.email AS vendedor_email,
    us.name AS sdr_nome_calculado,
    us.email AS sdr_email,
    ui.name AS inativador_nome_calculado,
    upa.name AS primeiro_ativador_nome_calculado,
    c.nome_crm AS empresa_nome,
    c.cnpj AS empresa_cnpj,
    ( SELECT cp.numero
           FROM company_phones cp
          WHERE cp.company_id = c.id AND cp.is_primary = true
         LIMIT 1) AS empresa_phone
   FROM customers cust
     JOIN companies c ON c.id = cust.company_id
     LEFT JOIN users uv ON uv.id = cust.vendedor_id
     LEFT JOIN users us ON us.id = cust.sdr_id
     LEFT JOIN users ui ON ui.id = cust.inativado_por_id
     LEFT JOIN users upa ON upa.id = cust.primeiro_ativador_id
  WHERE c.deleted_at IS NULL AND cust.deleted_at IS NULL;
```

## public.vw_dashboard_sdr (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customer_sdr_history, public.customers, public.sdr_closer_assignments, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT sdr.id AS sdr_id,
    sdr.name AS sdr_nome,
    ( SELECT count(*) AS count
           FROM sdr_closer_assignments a
          WHERE a.sdr_id = sdr.id AND a.data_fim IS NULL) AS qtd_closers,
    count(cu.id) AS total_prospectando,
    sum(
        CASE
            WHEN cu.ja_comprou THEN 1
            ELSE 0
        END) AS ex_clientes,
    sum(
        CASE
            WHEN NOT cu.ja_comprou THEN 1
            ELSE 0
        END) AS prospects,
    ( SELECT count(*) AS count
           FROM customer_sdr_history h
          WHERE h.sdr_id = sdr.id AND h.resultado = 'QUALIFICADO'::text AND h.data_passagem_closer >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS qualificados_mes,
    ( SELECT count(*) AS count
           FROM customer_sdr_history h
          WHERE h.sdr_id = sdr.id AND h.resultado = 'REATIVADO'::text AND h.data_fim >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS reativados_mes
   FROM users sdr
     LEFT JOIN customers cu ON cu.sdr_id = sdr.id AND cu.cliente_ativado = false
  WHERE sdr.is_sdr = true
  GROUP BY sdr.id, sdr.name
  ORDER BY (count(cu.id)) DESC;
```

## public.vw_dashboard_vendedor (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT cu.vendedor_id,
    u.name AS vendedor_nome,
    count(*) AS total_clientes,
    sum(
        CASE
            WHEN cu.cliente_ativado AND cu.ja_comprou THEN 1
            ELSE 0
        END) AS ativos,
    sum(
        CASE
            WHEN NOT cu.cliente_ativado AND cu.ja_comprou THEN 1
            ELSE 0
        END) AS ex_clientes,
    sum(
        CASE
            WHEN NOT cu.ja_comprou THEN 1
            ELSE 0
        END) AS prospects,
    sum(
        CASE
            WHEN cu.cliente_ativado AND cu.ja_comprou AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) > 120 THEN 1
            ELSE 0
        END) AS em_risco,
    sum(
        CASE
            WHEN cu.cliente_ativado AND cu.ja_comprou AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) > 165 THEN 1
            ELSE 0
        END) AS criticos,
    sum(
        CASE
            WHEN cu.cliente_ativado AND cu.ja_comprou AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) > 180 THEN 1
            ELSE 0
        END) AS para_inativar,
    sum(cu.valor_total_compras) AS valor_total_carteira
   FROM customers cu
     JOIN users u ON cu.vendedor_id = u.id
  WHERE cu.vendedor_id IS NOT NULL
  GROUP BY cu.vendedor_id, u.name
  ORDER BY (count(*)) DESC;
```

## public.vw_dashboard_vendedor_v2 (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customers, public.users |
| populada | n/a |
| comentário | Dashboard completo do vendedor com métricas avançadas |


```sql
WITH metricas_base AS (
         SELECT cu.vendedor_id,
            u.name AS vendedor_nome,
            count(*) AS total_clientes,
            count(*) FILTER (WHERE cu.cliente_ativado = true) AS ativos,
            count(*) FILTER (WHERE cu.cliente_ativado = false AND cu.ja_comprou = true) AS ex_clientes,
            count(*) FILTER (WHERE cu.cliente_ativado = false AND cu.ja_comprou = false) AS prospects,
            COALESCE(sum(cu.valor_total_compras), 0::numeric) AS valor_total_carteira,
            COALESCE(sum(cu.total_pedidos), 0::bigint) AS total_pedidos_carteira,
            COALESCE(avg(cu.valor_total_compras) FILTER (WHERE cu.ja_comprou = true), 0::numeric) AS ticket_medio_cliente,
            count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) >= 150 AND (CURRENT_DATE - cu.data_ultima_compra) <= 164) AS em_risco,
            count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) >= 165 AND (CURRENT_DATE - cu.data_ultima_compra) <= 179) AS criticos,
            count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) >= 180) AS para_inativar,
            count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_entrada_carteira >= (CURRENT_DATE - '30 days'::interval)) AS novos_30_dias,
            count(*) FILTER (WHERE cu.data_ultima_compra >= (CURRENT_DATE - '30 days'::interval)) AS compraram_30_dias
           FROM customers cu
             LEFT JOIN users u ON cu.vendedor_id = u.id
          WHERE cu.vendedor_id IS NOT NULL
          GROUP BY cu.vendedor_id, u.name
        )
 SELECT vendedor_id,
    vendedor_nome,
    total_clientes,
    ativos,
    ex_clientes,
    prospects,
        CASE
            WHEN total_clientes > 0 THEN round(ativos::numeric / total_clientes::numeric * 100::numeric, 1)
            ELSE 0::numeric
        END AS pct_ativos,
    valor_total_carteira,
    total_pedidos_carteira,
    round(ticket_medio_cliente, 2) AS ticket_medio_cliente,
    em_risco,
    criticos,
    para_inativar,
    em_risco + criticos + para_inativar AS total_alertas,
    novos_30_dias,
    compraram_30_dias
   FROM metricas_base
  ORDER BY valor_total_carteira DESC;
```

## public.vw_deal_velocity_benchmark (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.user_contacts_link, public.companies, public.contact_emails, public.contacts, public.deal_velocity_analysis, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    co.ramo_atividade AS segment,
    p.full_name AS owner_name,
    dv.avg_days_to_close,
    dv.current_deal_age,
    dv.velocity_rating,
    dv.bottleneck_stage,
    dv.vs_team_avg,
    dv.vs_segment_avg,
    dv.stage_velocity,
    dv.recommended_actions,
        CASE dv.velocity_rating
            WHEN 'fast'::text THEN '🚀 Rápido'::text
            WHEN 'normal'::text THEN '⏱️ Normal'::text
            WHEN 'slow'::text THEN '🐢 Lento'::text
            WHEN 'stalled'::text THEN '⛔ Parado'::text
            ELSE '❓ Não avaliado'::text
        END AS velocity_status,
        CASE dv.velocity_rating
            WHEN 'stalled'::text THEN 'URGENTE: Deal parado - verificar objeções'::text
            WHEN 'slow'::text THEN 'ATENÇÃO: Acelerar com oferta especial'::text
            WHEN 'normal'::text THEN 'Manter acompanhamento regular'::text
            ELSE 'Continuar - deal fluindo bem'::text
        END AS action_recommendation
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN user_contacts_link ucl ON c.id = ucl.contact_id
     LEFT JOIN profiles p ON ucl.user_id = p.id
     LEFT JOIN deal_velocity_analysis dv ON c.id = dv.contact_id
  WHERE dv.id IS NOT NULL
  ORDER BY dv.current_deal_age DESC NULLS LAST;
```

## public.vw_deals_full (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.deals, public.companies, public.contacts, public.lead_sources, public.loss_reasons, public.pipeline_stages, public.pipelines |
| populada | n/a |
| comentário |  |


```sql
SELECT d.id,
    d.codigo,
    d.titulo,
    d.pipeline_id,
    d.stage_id,
    d.status,
    d.company_id,
    d.contact_id,
    d.lead_id,
    d.source_id,
    d.valor,
    d.valor_mensal_recorrente,
    d.desconto_percentual,
    d.desconto_valor,
    d.valor_final,
    d.probabilidade,
    d.valor_ponderado,
    d.data_previsao_fechamento,
    d.data_fechamento,
    d.owner_id,
    d.created_by_id,
    d.loss_reason_id,
    d.loss_reason_detalhe,
    d.concorrente_vencedor,
    d.sla_expira_em,
    d.sla_status,
    d.prioridade,
    d.descricao,
    d.proximos_passos,
    d.observacoes,
    d.tags_array,
    d.dados_extras,
    d.dias_no_pipeline,
    d.dias_no_estagio_atual,
    d.created_at,
    d.updated_at,
    d.deleted_at,
    p.nome AS pipeline_nome,
    ps.nome AS stage_nome,
    ps.cor AS stage_cor,
    ls.nome AS source_nome,
    lr.nome AS loss_reason_nome,
    c.nome_crm AS company_nome,
    c.cnpj AS company_cnpj,
    ct.full_name AS contact_nome
   FROM _dormant.deals d
     LEFT JOIN pipelines p ON d.pipeline_id = p.id
     LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
     LEFT JOIN lead_sources ls ON d.source_id = ls.id
     LEFT JOIN loss_reasons lr ON d.loss_reason_id = lr.id
     LEFT JOIN companies c ON d.company_id = c.id
     LEFT JOIN contacts ct ON d.contact_id = ct.id
  WHERE d.deleted_at IS NULL;
```

## public.vw_disc_compatibility (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.activity_log, _dormant.disc_assessments, _dormant.user_contacts_link, _dormant.user_disc_profile, public.contact_emails, public.contacts, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS contact_email,
    da.primary_profile AS contact_disc,
    da.d_score AS contact_d,
    da.i_score AS contact_i,
    da.s_score AS contact_s,
    da.c_score AS contact_c,
    p.id AS user_id,
    p.full_name AS user_name,
    udp.primary_profile AS user_disc,
        CASE
            WHEN da.primary_profile IS NULL OR udp.primary_profile IS NULL THEN NULL::integer
            WHEN da.primary_profile = udp.primary_profile THEN 90
            WHEN da.primary_profile = 'D'::text AND udp.primary_profile = 'I'::text OR da.primary_profile = 'I'::text AND udp.primary_profile = 'D'::text THEN 75
            WHEN da.primary_profile = 'S'::text AND udp.primary_profile = 'C'::text OR da.primary_profile = 'C'::text AND udp.primary_profile = 'S'::text THEN 75
            WHEN da.primary_profile = 'D'::text AND udp.primary_profile = 'C'::text OR da.primary_profile = 'C'::text AND udp.primary_profile = 'D'::text THEN 60
            WHEN da.primary_profile = 'I'::text AND udp.primary_profile = 'S'::text OR da.primary_profile = 'S'::text AND udp.primary_profile = 'I'::text THEN 60
            WHEN da.primary_profile = 'D'::text AND udp.primary_profile = 'S'::text OR da.primary_profile = 'S'::text AND udp.primary_profile = 'D'::text THEN 40
            WHEN da.primary_profile = 'I'::text AND udp.primary_profile = 'C'::text OR da.primary_profile = 'C'::text AND udp.primary_profile = 'I'::text THEN 40
            ELSE 50
        END AS compatibility_score,
        CASE
            WHEN da.primary_profile IS NULL THEN 'Perfil DISC não definido'::text
            WHEN da.primary_profile = 'D'::text THEN 'Seja direto, objetivo e focado em resultados'::text
            WHEN da.primary_profile = 'I'::text THEN 'Seja entusiasmado, crie conexão pessoal'::text
            WHEN da.primary_profile = 'S'::text THEN 'Seja calmo, paciente, construa confiança'::text
            WHEN da.primary_profile = 'C'::text THEN 'Seja preciso, detalhado, use dados'::text
            ELSE 'Adapte-se ao perfil do cliente'::text
        END AS communication_tips,
        CASE
            WHEN da.primary_profile = 'D'::text AND udp.primary_profile = 'S'::text OR da.primary_profile = 'S'::text AND udp.primary_profile = 'D'::text THEN 'Ritmo: D é rápido, S é lento'::text
            WHEN da.primary_profile = 'I'::text AND udp.primary_profile = 'C'::text OR da.primary_profile = 'C'::text AND udp.primary_profile = 'I'::text THEN 'Foco: I é social, C é técnico'::text
            ELSE NULL::text
        END AS potential_conflicts,
        CASE
            WHEN da.primary_profile = 'D'::text THEN 'Vá direto ao ponto, mostre ROI, dê opções'::text
            WHEN da.primary_profile = 'I'::text THEN 'Crie rapport, use histórias, mostre reconhecimento'::text
            WHEN da.primary_profile = 'S'::text THEN 'Construa confiança, dê garantias, não pressione'::text
            WHEN da.primary_profile = 'C'::text THEN 'Forneça dados, documentação, dê tempo para análise'::text
            ELSE 'Adapte-se ao perfil identificado'::text
        END AS recommended_approach,
        CASE
            WHEN da.primary_profile IS NULL OR udp.primary_profile IS NULL THEN 'INDEFINIDO - Perfil incompleto'::text
            WHEN da.primary_profile = udp.primary_profile THEN 'ALTA - Mesmo perfil'::text
            WHEN da.primary_profile = 'D'::text AND udp.primary_profile = 'I'::text OR da.primary_profile = 'I'::text AND udp.primary_profile = 'D'::text THEN 'MÉDIA-ALTA - Extrovertidos'::text
            WHEN da.primary_profile = 'S'::text AND udp.primary_profile = 'C'::text OR da.primary_profile = 'C'::text AND udp.primary_profile = 'S'::text THEN 'MÉDIA-ALTA - Introvertidos'::text
            WHEN da.primary_profile = 'D'::text AND udp.primary_profile = 'S'::text OR da.primary_profile = 'S'::text AND udp.primary_profile = 'D'::text THEN 'BAIXA - Opostos (ritmo)'::text
            WHEN da.primary_profile = 'I'::text AND udp.primary_profile = 'C'::text OR da.primary_profile = 'C'::text AND udp.primary_profile = 'I'::text THEN 'BAIXA - Opostos (foco)'::text
            ELSE 'MÉDIA - Requer adaptação'::text
        END AS compatibility_level,
        CASE
            WHEN da.primary_profile IS NULL OR udp.primary_profile IS NULL THEN false
            WHEN da.primary_profile = 'D'::text AND udp.primary_profile = 'S'::text OR da.primary_profile = 'S'::text AND udp.primary_profile = 'D'::text OR da.primary_profile = 'I'::text AND udp.primary_profile = 'C'::text OR da.primary_profile = 'C'::text AND udp.primary_profile = 'I'::text THEN true
            ELSE false
        END AS needs_adaptation_alert
   FROM contacts c
     LEFT JOIN disc_assessments da ON c.id = da.contact_id AND (da.is_current = true OR da.is_current IS NULL)
     LEFT JOIN user_contacts_link ucl ON c.id = ucl.contact_id
     LEFT JOIN profiles p ON ucl.user_id = p.id
     LEFT JOIN user_disc_profile udp ON p.id = udp.user_id;
```

## public.vw_emotional_trend_by_contact (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.emotional_trend_snapshots, public.companies, public.contact_emails, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    ets.trend_direction,
    ets.trend_strength,
    ets.dominant_emotion,
    ets.avg_sentiment_score,
    ets.emotion_distribution,
    ets.positive_interactions,
    ets.neutral_interactions,
    ets.negative_interactions,
    ets.total_interactions,
    ets.period_start,
    ets.period_end,
    ets.patterns_identified,
    ets.triggers_positive,
    ets.triggers_negative,
        CASE ets.trend_direction
            WHEN 'improving'::text THEN '📈 Melhorando'::text
            WHEN 'stable'::text THEN '➡️ Estável'::text
            WHEN 'declining'::text THEN '📉 Declinando'::text
            ELSE '❓ Sem dados'::text
        END AS trend_status,
        CASE
            WHEN ets.trend_direction::text = 'declining'::text AND ets.trend_strength > 50::numeric THEN '🔴 ATENÇÃO: Declínio acentuado'::text
            WHEN ets.avg_sentiment_score < '-30'::integer::numeric THEN '🟠 ALERTA: Sentimento negativo'::text
            WHEN ets.negative_interactions > ets.positive_interactions THEN '🟡 CUIDADO: Mais interações negativas'::text
            ELSE '🟢 Normal'::text
        END AS alert_message,
    ets.recommended_actions
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN LATERAL ( SELECT emotional_trend_snapshots.id,
            emotional_trend_snapshots.contact_id,
            emotional_trend_snapshots.user_id,
            emotional_trend_snapshots.period_start,
            emotional_trend_snapshots.period_end,
            emotional_trend_snapshots.period_type,
            emotional_trend_snapshots.avg_sentiment_score,
            emotional_trend_snapshots.sentiment_variance,
            emotional_trend_snapshots.dominant_emotion,
            emotional_trend_snapshots.emotion_distribution,
            emotional_trend_snapshots.trend_direction,
            emotional_trend_snapshots.trend_strength,
            emotional_trend_snapshots.total_interactions,
            emotional_trend_snapshots.positive_interactions,
            emotional_trend_snapshots.neutral_interactions,
            emotional_trend_snapshots.negative_interactions,
            emotional_trend_snapshots.patterns_identified,
            emotional_trend_snapshots.triggers_positive,
            emotional_trend_snapshots.triggers_negative,
            emotional_trend_snapshots.recommended_actions,
            emotional_trend_snapshots.created_at
           FROM emotional_trend_snapshots
          WHERE emotional_trend_snapshots.contact_id = c.id
          ORDER BY emotional_trend_snapshots.period_end DESC
         LIMIT 1) ets ON true
  WHERE ets.id IS NOT NULL
  ORDER BY (
        CASE ets.trend_direction
            WHEN 'declining'::text THEN 1
            WHEN 'stable'::text THEN 2
            ELSE 3
        END);
```

## public.vw_empresa_historico_completo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customers |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS company_id,
    cust.id AS customer_id,
    c.bitrix_company_id,
    c.nome_crm AS empresa,
    c.cnpj,
    c.created_at AS data_cadastro_sistema,
    c.bitrix_created_at AS data_cadastro_bitrix,
    c.created_by_id AS cadastrado_por,
    c.status AS status_empresa,
    cust.cliente_ativado,
    cust.ja_comprou,
        CASE
            WHEN cust.cliente_ativado = false THEN 'INATIVO'::text
            WHEN cust.ja_comprou = false THEN 'PROSPECT'::text
            ELSE 'ATIVO'::text
        END AS classificacao,
    cust.vendedor_id,
    cust.vendedor_nome AS vendedor_carteira,
    cust.data_entrada_carteira,
    cust.data_primeira_compra,
    cust.data_ultima_compra,
    cust.total_pedidos,
    cust.valor_total_compras,
        CASE
            WHEN cust.data_ultima_compra IS NOT NULL THEN EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone)::integer
            ELSE NULL::integer
        END AS dias_sem_compra,
        CASE
            WHEN cust.data_ultima_compra IS NOT NULL THEN GREATEST(0, 180 - EXTRACT(day FROM now() - cust.data_ultima_compra::timestamp with time zone)::integer)
            ELSE NULL::integer
        END AS dias_para_inativar,
    c.updated_at AS ultima_atualizacao
   FROM companies c
     LEFT JOIN customers cust ON cust.company_id = c.id AND cust.deleted_at IS NULL
  WHERE c.deleted_at IS NULL;
```

## public.vw_empresa_timeline_completa (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_events, public.customers |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS company_id,
    c.nome_crm AS empresa,
    c.cnpj,
    ce.evento_tipo,
    ce.data_evento,
    ce.executado_por_nome,
    ce.motivo,
    ce.observacoes,
    ce.dados_extras
   FROM companies c
     LEFT JOIN customers cu ON cu.company_id = c.id
     LEFT JOIN customer_events ce ON ce.customer_id = cu.id
  WHERE ce.id IS NOT NULL
  ORDER BY c.id, ce.data_evento DESC;
```

## public.vw_empresas_hierarquia (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.grupos_economicos |
| populada | n/a |
| comentário |  |


```sql
SELECT co.id,
    co.nome_crm AS empresa,
    co.cnpj,
    ge.nome AS grupo_economico,
    ge.tipo AS tipo_grupo,
    co.is_matriz,
    matriz.nome_crm AS matriz_nome,
    co.tipo_cooperativa,
    central.nome_crm AS central_nome,
    singular.nome_crm AS singular_nome,
        CASE
            WHEN co.tipo_cooperativa = 'CENTRAL'::text THEN 'Central Cooperativa'::text
            WHEN co.tipo_cooperativa = 'SINGULAR'::text THEN 'Singular Cooperativa'::text
            WHEN co.tipo_cooperativa = 'PAC'::text THEN 'Posto de Atendimento'::text
            WHEN co.is_matriz = true THEN 'Matriz'::text
            WHEN co.is_matriz = false THEN 'Filial'::text
            ELSE 'Empresa Individual'::text
        END AS classificacao_hierarquia,
    co.is_customer,
    co.is_supplier,
    co.is_carrier,
    co.status
   FROM companies co
     LEFT JOIN grupos_economicos ge ON co.grupo_economico_id = ge.id
     LEFT JOIN companies matriz ON co.matriz_id = matriz.id
     LEFT JOIN companies central ON co.central_id = central.id
     LEFT JOIN companies singular ON co.singular_id = singular.id;
```

## public.vw_eq_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.closing_moment_analysis, _dormant.contact_eq_scores, _dormant.disc_assessments, _dormant.emotional_trend_snapshots, public.companies, public.contacts |
| populada | n/a |
| comentário | Dashboard consolidado de inteligência emocional |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    eq.eq_score,
    eq.eq_level,
    eq.communication_style,
    ets.trend_direction AS emotional_trend,
    ets.avg_sentiment_score,
    cma.recommended_timing AS closing_timing,
    cma.timing_score AS closing_readiness,
    da.primary_profile AS disc_type,
    c.relationship_score,
        CASE
            WHEN cma.recommended_timing::text = 'now'::text THEN '🎯 PRIORIDADE: Fechar agora!'::text
            WHEN ets.trend_direction::text = 'declining'::text THEN '⚠️ ATENÇÃO: Tendência negativa'::text
            WHEN eq.eq_level::text = 'very_low'::text THEN '🧠 CUIDADO: EQ baixo'::text
            WHEN cma.recommended_timing::text = 'soon'::text THEN '📞 AÇÃO: Agendar contato'::text
            ELSE '✅ MANTER: Acompanhamento regular'::text
        END AS action_summary
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN contact_eq_scores eq ON c.id = eq.contact_id AND eq.is_current = true
     LEFT JOIN LATERAL ( SELECT emotional_trend_snapshots.id,
            emotional_trend_snapshots.contact_id,
            emotional_trend_snapshots.user_id,
            emotional_trend_snapshots.period_start,
            emotional_trend_snapshots.period_end,
            emotional_trend_snapshots.period_type,
            emotional_trend_snapshots.avg_sentiment_score,
            emotional_trend_snapshots.sentiment_variance,
            emotional_trend_snapshots.dominant_emotion,
            emotional_trend_snapshots.emotion_distribution,
            emotional_trend_snapshots.trend_direction,
            emotional_trend_snapshots.trend_strength,
            emotional_trend_snapshots.total_interactions,
            emotional_trend_snapshots.positive_interactions,
            emotional_trend_snapshots.neutral_interactions,
            emotional_trend_snapshots.negative_interactions,
            emotional_trend_snapshots.patterns_identified,
            emotional_trend_snapshots.triggers_positive,
            emotional_trend_snapshots.triggers_negative,
            emotional_trend_snapshots.recommended_actions,
            emotional_trend_snapshots.created_at
           FROM emotional_trend_snapshots
          WHERE emotional_trend_snapshots.contact_id = c.id
          ORDER BY emotional_trend_snapshots.period_end DESC
         LIMIT 1) ets ON true
     LEFT JOIN closing_moment_analysis cma ON c.id = cma.contact_id AND cma.is_current = true
     LEFT JOIN disc_assessments da ON c.id = da.contact_id AND da.is_current = true
  WHERE eq.id IS NOT NULL OR ets.id IS NOT NULL OR cma.id IS NOT NULL;
```

## public.vw_eq_evolution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.contact_eq_scores, public.companies, public.contact_emails, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    eq.eq_score AS current_eq_score,
    eq.eq_level AS current_eq_level,
    eq.assessed_at AS last_assessment,
    eq.self_awareness_score,
    eq.self_management_score,
    eq.social_awareness_score,
    eq.relationship_management_score,
    eq.communication_style,
    eq.preferred_approach,
        CASE
            WHEN eq.self_awareness_score >= 70 THEN '🟢'::text
            WHEN eq.self_awareness_score >= 40 THEN '🟡'::text
            ELSE '🔴'::text
        END AS sa_status,
        CASE
            WHEN eq.self_management_score >= 70 THEN '🟢'::text
            WHEN eq.self_management_score >= 40 THEN '🟡'::text
            ELSE '🔴'::text
        END AS sm_status,
        CASE
            WHEN eq.social_awareness_score >= 70 THEN '🟢'::text
            WHEN eq.social_awareness_score >= 40 THEN '🟡'::text
            ELSE '🔴'::text
        END AS soa_status,
        CASE
            WHEN eq.relationship_management_score >= 70 THEN '🟢'::text
            WHEN eq.relationship_management_score >= 40 THEN '🟡'::text
            ELSE '🔴'::text
        END AS rm_status,
    eq.sales_implications,
    eq.recommended_techniques,
    eq.avoid_techniques,
    eq.confidence_level
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN contact_eq_scores eq ON c.id = eq.contact_id AND eq.is_current = true
  WHERE eq.id IS NOT NULL
  ORDER BY eq.eq_score DESC NULLS LAST;
```

## public.vw_forecast_mensal (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.deals, public.pipelines |
| populada | n/a |
| comentário |  |


```sql
SELECT date_trunc('month'::text, d.data_previsao_fechamento::timestamp with time zone) AS mes,
    d.pipeline_id,
    p.nome AS pipeline_nome,
    d.owner_id,
    count(*) AS total_deals,
    sum(d.valor_final) AS valor_total,
    sum(d.valor_ponderado) AS valor_ponderado,
    avg(d.probabilidade) AS probabilidade_media
   FROM _dormant.deals d
     JOIN pipelines p ON d.pipeline_id = p.id
  WHERE d.status = 'aberto'::deal_status AND d.deleted_at IS NULL AND d.data_previsao_fechamento IS NOT NULL
  GROUP BY (date_trunc('month'::text, d.data_previsao_fechamento::timestamp with time zone)), d.pipeline_id, p.nome, d.owner_id
  ORDER BY (date_trunc('month'::text, d.data_previsao_fechamento::timestamp with time zone)), p.nome;
```

## public.vw_grupos_economicos_resumo (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customers, public.grupos_economicos, public.sync_log |
| populada | n/a |
| comentário |  |


```sql
SELECT ge.id AS grupo_id,
    ge.nome AS grupo_economico,
    ge.tipo AS tipo_grupo,
    count(co.id) AS total_empresas,
    sum(
        CASE
            WHEN co.tipo_cooperativa = 'CENTRAL'::text THEN 1
            ELSE 0
        END) AS centrais,
    sum(
        CASE
            WHEN co.tipo_cooperativa = 'SINGULAR'::text THEN 1
            ELSE 0
        END) AS singulares,
    sum(
        CASE
            WHEN co.tipo_cooperativa = 'PAC'::text THEN 1
            ELSE 0
        END) AS pacs,
    sum(
        CASE
            WHEN co.is_matriz = true AND co.tipo_cooperativa IS NULL THEN 1
            ELSE 0
        END) AS matrizes,
    sum(
        CASE
            WHEN co.is_matriz = false THEN 1
            ELSE 0
        END) AS filiais,
    sum(
        CASE
            WHEN co.is_customer THEN 1
            ELSE 0
        END) AS clientes,
    sum(cu.valor_total_compras) AS valor_total_grupo
   FROM grupos_economicos ge
     LEFT JOIN companies co ON co.grupo_economico_id = ge.id
     LEFT JOIN customers cu ON cu.company_id = co.id
  GROUP BY ge.id, ge.nome, ge.tipo
  ORDER BY (count(co.id)) DESC;
```

## public.vw_historico_alertas (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.alertas_inativacao, public.companies |
| populada | n/a |
| comentário | Histórico completo de alertas para análise |


```sql
SELECT ai.id AS alerta_id,
    ai.vendedor_id,
    ai.vendedor_nome,
    c.nome_crm AS empresa,
    ai.tipo_alerta,
    ai.severidade,
    ai.dias_sem_compra,
    ai.valor_em_risco,
    ai.status,
    ai.data_referencia AS data_alerta,
    ai.created_at,
    ai.resolvido_em,
    ai.resolvido_por_nome,
    ai.observacao_resolucao,
        CASE
            WHEN ai.resolvido_em IS NOT NULL THEN EXTRACT(epoch FROM ai.resolvido_em - ai.created_at) / 3600::numeric
            ELSE NULL::numeric
        END AS horas_para_resolver
   FROM alertas_inativacao ai
     JOIN companies c ON ai.company_id = c.id
  ORDER BY ai.created_at DESC;
```

## public.vw_historico_carteira (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_ownership_history, public.sync_log |
| populada | n/a |
| comentário |  |


```sql
SELECT coh.id,
    coh.customer_id,
    coh.company_id,
    coh.vendedor_id,
    coh.data_inicio,
    coh.data_fim,
    coh.motivo_entrada,
    coh.motivo_saida,
    coh.registrado_por_id,
    coh.registrado_por_nome,
    coh.observacoes,
    coh.created_at,
    coh.updated_at,
    c.nome_crm AS empresa_nome,
    c.cnpj AS empresa_cnpj
   FROM customer_ownership_history coh
     LEFT JOIN companies c ON coh.company_id = c.id
  ORDER BY coh.data_inicio DESC;
```

## public.vw_historico_carteira_empresa (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_ownership_history, public.sync_log |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS company_id,
    c.nome_crm AS empresa,
    c.cnpj,
    coh.vendedor_id,
    coh.data_inicio,
    coh.data_fim,
    coh.motivo_entrada,
    coh.motivo_saida,
    coh.observacoes
   FROM companies c
     JOIN customer_ownership_history coh ON coh.company_id = c.id
  ORDER BY c.id, coh.data_inicio DESC;
```

## public.vw_historico_prospects (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_ownership_history, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT co.id AS company_id,
    co.nome_crm AS empresa,
    cu.id AS customer_id,
    count(h.id) AS total_vendedores,
    string_agg(((u.name || ' ('::text) || h.data_inicio::text) || ')'::text, ' → '::text ORDER BY h.data_inicio) AS sequencia_vendedores
   FROM customer_ownership_history h
     JOIN customers cu ON h.customer_id = cu.id
     JOIN companies co ON cu.company_id = co.id
     JOIN users u ON h.vendedor_id = u.id
  WHERE cu.ja_comprou = false
  GROUP BY co.id, co.nome_crm, cu.id
  ORDER BY (count(h.id)) DESC;
```

## public.vw_historico_sdr_closer (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.sdr_closer_assignments, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT sdr.name AS sdr_nome,
    closer.name AS closer_nome,
    a.data_inicio,
    a.data_fim,
        CASE
            WHEN a.data_fim IS NULL THEN '🟢 ATIVO'::text
            ELSE '⚪ ENCERRADO'::text
        END AS status,
    COALESCE(a.data_fim, CURRENT_DATE) - a.data_inicio AS dias_duracao,
    a.motivo_alteracao,
    uc.name AS criado_por
   FROM sdr_closer_assignments a
     JOIN users sdr ON a.sdr_id = sdr.id
     JOIN users closer ON a.closer_id = closer.id
     LEFT JOIN users uc ON a.criado_por_id = uc.id
  ORDER BY sdr.name, a.data_inicio DESC;
```

## public.vw_historico_sdr_empresa (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_sdr_history, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT co.id AS company_id,
    co.nome_crm AS empresa,
    co.cnpj,
    h.customer_id,
    h.sdr_id,
    sdr.name AS sdr_nome,
    h.data_inicio,
    h.data_fim,
        CASE
            WHEN h.data_fim IS NULL THEN '🟢 EM ANDAMENTO'::text
            ELSE '⚪ ENCERRADO'::text
        END AS status,
    h.resultado,
    h.closer_destino_id,
    closer.name AS closer_destino_nome,
    h.data_passagem_closer,
    h.qtd_tentativas_contato,
    h.qtd_conversas,
    COALESCE(h.data_fim, CURRENT_DATE) - h.data_inicio AS dias_prospectando,
    h.observacoes
   FROM customer_sdr_history h
     JOIN companies co ON h.company_id = co.id
     JOIN users sdr ON h.sdr_id = sdr.id
     LEFT JOIN users closer ON h.closer_destino_id = closer.id
  ORDER BY co.nome_crm, h.data_inicio DESC;
```

## public.vw_interacoes_sem_apelido (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contacts, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT i.id AS interaction_id,
    i.contact_id,
    (c.first_name || ' '::text) || COALESCE(c.last_name, ''::text) AS full_name,
    NULL::text AS nome_tratamento,
    i.company_id,
    co.nome_crm AS empresa,
    i.channel AS canal,
    i.data_interacao,
    i.created_by,
    i.usuario_responsavel_id AS vendedor,
    i.user_id
   FROM interactions i
     JOIN contacts c ON c.id = i.contact_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL
     LEFT JOIN companies co ON co.id = i.company_id AND co.user_id = auth.uid() AND co.deleted_at IS NULL
  WHERE i.user_id = auth.uid();
```

## public.vw_interaction_timeline (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_emails, public.contact_phones, public.contacts, public.interactions |
| populada | n/a |
| comentário |  |


```sql
SELECT i.id,
    i.company_id,
    i.contact_id,
    i.channel,
    i.direction,
    i.status,
    i.assunto,
    i.resumo,
    i.data_interacao,
    i.duracao_segundos,
    i.created_at,
    ct.full_name AS contato_nome,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = ct.id AND ce.is_primary = true
         LIMIT 1) AS contato_email,
    ( SELECT cp.numero_normalizado
           FROM contact_phones cp
          WHERE cp.contact_id = ct.id AND cp.is_primary = true
         LIMIT 1) AS contato_phone,
    co.nome_crm AS empresa_nome,
    co.razao_social AS empresa_razao_social,
    co.cnpj AS empresa_cnpj
   FROM interactions i
     LEFT JOIN contacts ct ON i.contact_id = ct.id
     LEFT JOIN companies co ON i.company_id = co.id
  ORDER BY i.data_interacao DESC;
```

## public.vw_leads_full (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.leads, public.companies, public.contacts, public.lead_sources, public.pipeline_stages, public.pipelines |
| populada | n/a |
| comentário |  |


```sql
SELECT l.id,
    l.codigo,
    l.pipeline_id,
    l.stage_id,
    l.status,
    l.company_id,
    l.contact_id,
    l.empresa_nome,
    l.empresa_cnpj,
    l.contato_nome,
    l.contato_email,
    l.contato_telefone,
    l.contato_cargo,
    l.source_id,
    l.campanha,
    l.utm_source,
    l.utm_medium,
    l.utm_campaign,
    l.temperatura,
    l.score,
    l.prioridade,
    l.valor_estimado,
    l.owner_id,
    l.created_by_id,
    l.data_primeiro_contato,
    l.data_ultimo_contato,
    l.data_qualificacao,
    l.data_conversao,
    l.sla_expira_em,
    l.sla_status,
    l.interesse,
    l.observacoes,
    l.tags_array,
    l.dados_extras,
    l.convertido_para_deal_id,
    l.motivo_desqualificacao,
    l.created_at,
    l.updated_at,
    l.deleted_at,
    p.nome AS pipeline_nome,
    ps.nome AS stage_nome,
    ps.cor AS stage_cor,
    ls.nome AS source_nome,
    c.nome_crm AS company_nome,
    ct.full_name AS contact_nome_vinculado
   FROM leads l
     LEFT JOIN pipelines p ON l.pipeline_id = p.id
     LEFT JOIN pipeline_stages ps ON l.stage_id = ps.id
     LEFT JOIN lead_sources ls ON l.source_id = ls.id
     LEFT JOIN companies c ON l.company_id = c.id
     LEFT JOIN contacts ct ON l.contact_id = ct.id
  WHERE l.deleted_at IS NULL;
```

## public.vw_matriz_filiais (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.grupos_economicos |
| populada | n/a |
| comentário |  |


```sql
SELECT matriz.id AS matriz_id,
    matriz.nome_crm AS matriz_nome,
    matriz.cnpj AS matriz_cnpj,
    ge.nome AS grupo_economico,
    count(filial.id) AS total_filiais,
    string_agg(filial.nome_crm, ', '::text ORDER BY filial.nome_crm) AS filiais
   FROM companies matriz
     LEFT JOIN companies filial ON filial.matriz_id = matriz.id
     LEFT JOIN grupos_economicos ge ON matriz.grupo_economico_id = ge.id
  WHERE matriz.is_matriz = true
  GROUP BY matriz.id, matriz.nome_crm, matriz.cnpj, ge.nome
 HAVING count(filial.id) > 0
  ORDER BY (count(filial.id)) DESC;
```

## public.vw_notification_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.digest_history, _dormant.inactivity_alerts, _dormant.notification_settings, _dormant.notifications, _dormant.smart_reminders, public.contacts, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT p.id AS user_id,
    p.email,
    ( SELECT count(*) AS count
           FROM _dormant.notifications n
          WHERE n.user_id = p.id AND n.is_read = false AND n.is_dismissed = false) AS unread_notifications,
    ( SELECT count(*) AS count
           FROM _dormant.notifications n
          WHERE n.user_id = p.id AND n.is_read = false AND n.category::text = 'urgent'::text) AS urgent_notifications,
    ( SELECT count(*) AS count
           FROM smart_reminders sr
          WHERE sr.user_id = p.id AND sr.status::text = 'pending'::text AND date(sr.remind_at) = CURRENT_DATE) AS todays_reminders,
    ( SELECT count(*) AS count
           FROM smart_reminders sr
          WHERE sr.user_id = p.id AND sr.status::text = 'pending'::text AND sr.remind_at < now()) AS overdue_reminders,
    ( SELECT count(*) AS count
           FROM _dormant.inactivity_alerts ia
             JOIN contacts c ON ia.contact_id = c.id
          WHERE ia.status::text = 'active'::text) AS active_alerts,
    ( SELECT max(notifications.created_at) AS max
           FROM _dormant.notifications
          WHERE notifications.user_id = p.id) AS last_notification,
    ( SELECT max(digest_history.sent_at) AS max
           FROM digest_history
          WHERE digest_history.user_id = p.id) AS last_digest,
    ns.email_enabled,
    ns.push_enabled,
    ns.daily_digest_enabled,
    ns.weekly_digest_enabled
   FROM profiles p
     LEFT JOIN notification_settings ns ON p.id = ns.user_id;
```

## public.vw_pending_followups (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_emails, public.contacts, public.disc_analysis_history, public.interactions, public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT i.id AS interaction_id,
    i.contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS contact_email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    i.title AS interaction_title,
    i.type AS interaction_type,
    COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) AS follow_up_date,
    i.conteudo AS follow_up_notes,
    p.full_name AS owner_name,
    p.email AS owner_email,
        CASE
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < (now() - '7 days'::interval) THEN 'CRÍTICO - Muito atrasado'::text
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < (now() - '2 days'::interval) THEN 'ATRASADO'::text
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup)::date = CURRENT_DATE THEN 'VENCIDO HOJE'::text
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup)::date = (CURRENT_DATE + 1) THEN 'AMANHÃ'::text
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < (now() + '7 days'::interval) THEN 'ESTA SEMANA'::text
            ELSE 'FUTURO'::text
        END AS followup_status,
    EXTRACT(day FROM now() - COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup))::integer AS days_overdue,
        CASE
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < (now() - '7 days'::interval) THEN 1
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < now() THEN 2
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < (now() + '1 day'::interval) THEN 3
            ELSE 4
        END AS priority,
    da.primary_profile AS contact_disc,
    c.relationship_score AS closing_score
   FROM interactions i
     JOIN contacts c ON c.id = i.contact_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL
     LEFT JOIN companies co ON co.id = c.company_id AND co.user_id = auth.uid() AND co.deleted_at IS NULL
     LEFT JOIN profiles p ON p.id = i.user_id
     LEFT JOIN LATERAL ( SELECT d.primary_profile
           FROM disc_analysis_history d
          WHERE d.contact_id = c.id AND d.user_id = auth.uid()
          ORDER BY d.analyzed_at DESC, d.id DESC
         LIMIT 1) da ON true
  WHERE i.user_id = auth.uid() AND (i.follow_up_required = true OR i.requer_followup = true) AND (i.followup_concluido = false OR i.followup_concluido IS NULL) AND COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) IS NOT NULL
  ORDER BY (
        CASE
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < (now() - '7 days'::interval) THEN 1
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < now() THEN 2
            WHEN COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup) < (now() + '1 day'::interval) THEN 3
            ELSE 4
        END), (COALESCE(i.follow_up_date::timestamp with time zone, i.data_followup));
```

## public.vw_pending_notifications (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.notifications, public.companies, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT n.id,
    n.user_id,
    n.notification_type,
    n.category,
    n.priority,
    n.title,
    n.message,
    n.icon,
    n.contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    n.company_id,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    n.action_url,
    n.action_label,
    n.scheduled_for,
    n.created_at,
    EXTRACT(epoch FROM now() - n.created_at) / 3600::numeric AS hours_ago,
        CASE n.category
            WHEN 'urgent'::text THEN '🔴'::text
            WHEN 'important'::text THEN '🟠'::text
            WHEN 'normal'::text THEN '🔵'::text
            ELSE '⚪'::text
        END AS priority_icon,
        CASE n.notification_type
            WHEN 'follow_up'::text THEN '📞 Follow-up'::text
            WHEN 'meeting'::text THEN '📅 Reunião'::text
            WHEN 'alert'::text THEN '⚠️ Alerta'::text
            WHEN 'churn_risk'::text THEN '🚨 Risco Churn'::text
            WHEN 'closing_opportunity'::text THEN '🎯 Oportunidade'::text
            WHEN 'birthday'::text THEN '🎂 Aniversário'::text
            ELSE '📌 '::text || n.notification_type::text
        END AS type_label
   FROM _dormant.notifications n
     LEFT JOIN contacts c ON n.contact_id = c.id
     LEFT JOIN companies co ON n.company_id = co.id
  WHERE n.is_read = false AND n.is_dismissed = false AND (n.expires_at IS NULL OR n.expires_at > now()) AND n.scheduled_for <= now()
  ORDER BY n.priority, n.created_at DESC;
```

## public.vw_pipeline_stats (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.deals, _dormant.leads, public.pipeline_stages, public.pipelines |
| populada | n/a |
| comentário |  |


```sql
SELECT p.id AS pipeline_id,
    p.nome AS pipeline_nome,
    ps.id AS stage_id,
    ps.nome AS stage_nome,
    ps.ordem,
    ps.cor,
    ps.probabilidade,
    count(DISTINCT l.id) FILTER (WHERE l.deleted_at IS NULL) AS total_leads,
    count(DISTINCT d.id) FILTER (WHERE d.deleted_at IS NULL AND d.status = 'aberto'::deal_status) AS total_deals,
    COALESCE(sum(d.valor_final) FILTER (WHERE d.deleted_at IS NULL AND d.status = 'aberto'::deal_status), 0::numeric) AS valor_total,
    COALESCE(sum(d.valor_ponderado) FILTER (WHERE d.deleted_at IS NULL AND d.status = 'aberto'::deal_status), 0::numeric) AS valor_ponderado
   FROM pipelines p
     JOIN pipeline_stages ps ON p.id = ps.pipeline_id
     LEFT JOIN leads l ON l.stage_id = ps.id
     LEFT JOIN _dormant.deals d ON d.stage_id = ps.id
  WHERE p.is_active = true
  GROUP BY p.id, p.nome, ps.id, ps.nome, ps.ordem, ps.cor, ps.probabilidade
  ORDER BY p.ordem, ps.ordem;
```

## public.vw_pix_accounts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.pix_accounts, public.companies |
| populada | n/a |
| comentário |  |


```sql
SELECT p.id AS pix_id,
    p.company_id,
    c.razao_social,
    c.nome_fantasia,
    c.cnpj,
    p.pix_tipo,
    p.pix_chave,
    p.pix_favorecido,
    p.is_active,
    p.created_by,
    p.updated_by,
    p.created_at,
    p.updated_at
   FROM pix_accounts p
     JOIN companies c ON c.id = p.company_id;
```

## public.vw_primeiro_ativador (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_events |
| populada | n/a |
| comentário |  |


```sql
SELECT DISTINCT ON (ce.customer_id) ce.customer_id,
    ce.company_id,
    c.nome_crm AS empresa,
    ce.executado_por_id AS primeiro_ativador_id,
    ce.executado_por_nome AS primeiro_ativador_nome,
    ce.data_evento AS data_primeira_ativacao
   FROM customer_events ce
     LEFT JOIN companies c ON ce.company_id = c.id
  WHERE ce.evento_tipo = 'ATIVACAO'::text
  ORDER BY ce.customer_id, ce.data_evento;
```

## public.vw_quem_ativou (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_events |
| populada | n/a |
| comentário |  |


```sql
SELECT ce.customer_id,
    ce.company_id,
    c.nome_crm AS empresa,
    ce.executado_por_id AS ativador_id,
    ce.executado_por_nome AS ativador_nome,
    ce.data_evento AS data_ativacao,
    ce.evento_tipo,
    ce.observacoes
   FROM customer_events ce
     LEFT JOIN companies c ON ce.company_id = c.id
  WHERE ce.evento_tipo = ANY (ARRAY['ATIVACAO'::text, 'REATIVACAO'::text])
  ORDER BY ce.data_evento DESC;
```

## public.vw_quem_inativou (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_events |
| populada | n/a |
| comentário |  |


```sql
SELECT ce.customer_id,
    ce.company_id,
    c.nome_crm AS empresa,
    ce.executado_por_id AS inativador_id,
    ce.executado_por_nome AS inativador_nome,
    ce.data_evento AS data_inativacao,
    ce.motivo AS motivo_inativacao,
    ce.observacoes
   FROM customer_events ce
     LEFT JOIN companies c ON ce.company_id = c.id
  WHERE ce.evento_tipo = 'INATIVACAO'::text
  ORDER BY ce.data_evento DESC;
```

## public.vw_rapport_points (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.contact_communication_style, _dormant.rapport_score_history, _dormant.shared_interests, public.companies, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    ccs.pace,
    ccs.tone,
    ccs.detail_preference,
    ccs.decision_style,
    ccs.prefers_data,
    ccs.prefers_stories,
    ccs.prefers_visuals,
    ccs.frequent_words,
    ccs.mirroring_tips,
    ( SELECT jsonb_agg(jsonb_build_object('category', si.interest_category, 'name', si.interest_name, 'starters', si.conversation_starters)) AS jsonb_agg
           FROM shared_interests si
          WHERE si.contact_id = c.id AND si.is_active = true) AS shared_interests,
    rsh.rapport_score,
    rsh.rapport_level,
    rsh.improvement_suggestions,
        CASE rsh.rapport_level
            WHEN 'excellent'::text THEN '💚 Excelente'::text
            WHEN 'good'::text THEN '💙 Bom'::text
            WHEN 'developing'::text THEN '💛 Desenvolvendo'::text
            WHEN 'weak'::text THEN '🧡 Fraco'::text
            ELSE '❤️ Construir'::text
        END AS rapport_status
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN contact_communication_style ccs ON c.id = ccs.contact_id AND ccs.is_current = true
     LEFT JOIN rapport_score_history rsh ON c.id = rsh.contact_id AND rsh.is_current = true
  ORDER BY rsh.rapport_score DESC NULLS LAST;
```

## public.vw_recommended_scripts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.sales_scripts, public.script_sections |
| populada | n/a |
| comentário |  |


```sql
SELECT id AS script_id,
    script_name,
    script_code,
    script_type,
    stage,
    channel,
    description,
    objective,
    estimated_duration_minutes,
    success_rate,
    times_used,
    recommended_disc_types,
    ( SELECT count(*) AS count
           FROM script_sections
          WHERE script_sections.script_id = ss.id) AS total_sections,
        CASE
            WHEN success_rate >= 70::numeric THEN '🏆 Alta Performance'::text
            WHEN success_rate >= 50::numeric THEN '✅ Boa Performance'::text
            WHEN times_used < 5 THEN '🆕 Novo'::text
            ELSE '📊 Em Avaliação'::text
        END AS performance_status
   FROM sales_scripts ss
  WHERE is_active = true
  ORDER BY success_rate DESC NULLS LAST, times_used DESC;
```

## public.vw_reframe_suggestions (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.sleight_of_mouth_examples, public.sleight_of_mouth_patterns |
| populada | n/a |
| comentário |  |


```sql
SELECT id AS pattern_id,
    pattern_name,
    pattern_code,
    category,
    description,
    structure,
    example_objection,
    example_response,
    effectiveness_score,
    difficulty_level,
    recommended_contexts,
    disc_compatibility,
    ( SELECT jsonb_agg(jsonb_build_object('context', soe.context, 'objection', soe.objection_text, 'response', soe.reframe_response, 'success_rate', soe.success_rate)) AS jsonb_agg
           FROM sleight_of_mouth_examples soe
          WHERE soe.pattern_id = sop.id AND soe.is_active = true
         LIMIT 5) AS examples,
        CASE
            WHEN effectiveness_score >= 80::numeric THEN '⭐ Altamente Efetivo'::text
            WHEN effectiveness_score >= 60::numeric THEN '✅ Efetivo'::text
            ELSE '📝 Em Desenvolvimento'::text
        END AS effectiveness_status
   FROM sleight_of_mouth_patterns sop
  WHERE is_active = true
  ORDER BY effectiveness_score DESC, display_order;
```

## public.vw_resumo_alertas_vendedor (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.alertas_inativacao |
| populada | n/a |
| comentário | Resumo de alertas por vendedor para dashboard |


```sql
SELECT vendedor_id,
    vendedor_nome,
    count(*) FILTER (WHERE tipo_alerta = 'INATIVAR'::text AND status = 'PENDENTE'::text) AS alertas_inativar,
    count(*) FILTER (WHERE tipo_alerta = 'CRITICO'::text AND status = 'PENDENTE'::text) AS alertas_criticos,
    count(*) FILTER (WHERE tipo_alerta = 'RISCO'::text AND status = 'PENDENTE'::text) AS alertas_risco,
    count(*) FILTER (WHERE status = 'PENDENTE'::text) AS total_pendentes,
    count(*) FILTER (WHERE status = 'EM_ANDAMENTO'::text) AS total_em_andamento,
    COALESCE(sum(valor_em_risco) FILTER (WHERE status = 'PENDENTE'::text), 0::numeric) AS valor_total_em_risco,
    min(dias_para_inativar) FILTER (WHERE status = 'PENDENTE'::text AND dias_para_inativar > 0) AS dias_mais_urgente,
        CASE
            WHEN count(*) FILTER (WHERE tipo_alerta = 'INATIVAR'::text AND status = 'PENDENTE'::text) > 0 THEN ('⚠️ '::text || count(*) FILTER (WHERE tipo_alerta = 'INATIVAR'::text AND status = 'PENDENTE'::text)) || ' cliente(s) para INATIVAR!'::text
            WHEN count(*) FILTER (WHERE tipo_alerta = 'CRITICO'::text AND status = 'PENDENTE'::text) > 0 THEN ('🔴 '::text || count(*) FILTER (WHERE tipo_alerta = 'CRITICO'::text AND status = 'PENDENTE'::text)) || ' cliente(s) em situação CRÍTICA!'::text
            WHEN count(*) FILTER (WHERE tipo_alerta = 'RISCO'::text AND status = 'PENDENTE'::text) > 0 THEN ('🟠 '::text || count(*) FILTER (WHERE tipo_alerta = 'RISCO'::text AND status = 'PENDENTE'::text)) || ' cliente(s) em RISCO'::text
            ELSE '✅ Nenhum alerta pendente'::text
        END AS mensagem_resumo
   FROM alertas_inativacao ai
  WHERE vendedor_id IS NOT NULL
  GROUP BY vendedor_id, vendedor_nome;
```

## public.vw_resumo_diario_vendedor (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customers, public.users |
| populada | n/a |
| comentário | Resumo diário para dashboard do vendedor |


```sql
SELECT cu.vendedor_id,
    u.name AS vendedor_nome,
    count(*) FILTER (WHERE cu.cliente_ativado = true) AS total_ativos,
    count(*) FILTER (WHERE cu.cliente_ativado = false AND cu.ja_comprou = false) AS total_prospects,
    count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) >= 165) AS alertas_urgentes,
    count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) >= 150 AND (CURRENT_DATE - cu.data_ultima_compra) <= 164) AS alertas_risco,
    COALESCE(sum(cu.valor_total_compras) FILTER (WHERE cu.cliente_ativado = true), 0::numeric) AS valor_carteira_ativa,
        CASE
            WHEN count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) >= 165) > 0 THEN '⚠️ Você tem clientes URGENTES para contatar!'::text
            WHEN count(*) FILTER (WHERE cu.cliente_ativado = true AND cu.data_ultima_compra IS NOT NULL AND (CURRENT_DATE - cu.data_ultima_compra) >= 150 AND (CURRENT_DATE - cu.data_ultima_compra) <= 164) > 0 THEN '📋 Você tem clientes em RISCO. Faça follow-up.'::text
            ELSE '✅ Carteira em dia! Continue o bom trabalho.'::text
        END AS mensagem_dia
   FROM customers cu
     LEFT JOIN users u ON cu.vendedor_id = u.id
  WHERE cu.vendedor_id IS NOT NULL
  GROUP BY cu.vendedor_id, u.name;
```

## public.vw_risco_inativacao (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT co.id AS company_id,
    co.nome_crm AS empresa,
    cu.vendedor_id,
    uv.name AS vendedor_nome,
    cu.data_ultima_compra,
    CURRENT_DATE - cu.data_ultima_compra AS dias_sem_compra,
    180 - (CURRENT_DATE - cu.data_ultima_compra) AS dias_para_inativar,
        CASE
            WHEN cu.data_ultima_compra IS NULL THEN '⚪ SEM COMPRAS'::text
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 180 THEN '🔴 INATIVAR AGORA'::text
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 165 THEN '🟠 CRÍTICO'::text
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 150 THEN '🟡 ALERTA'::text
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 120 THEN '🟢 ATENÇÃO'::text
            ELSE '✅ OK'::text
        END AS status_risco,
        CASE
            WHEN cu.data_ultima_compra IS NULL THEN 0
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 180 THEN 5
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 165 THEN 4
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 150 THEN 3
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 120 THEN 2
            ELSE 1
        END AS prioridade,
    cu.total_pedidos,
    cu.valor_total_compras
   FROM customers cu
     JOIN companies co ON cu.company_id = co.id
     LEFT JOIN users uv ON cu.vendedor_id = uv.id
  WHERE cu.cliente_ativado = true AND cu.ja_comprou = true
  ORDER BY (
        CASE
            WHEN cu.data_ultima_compra IS NULL THEN 0
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 180 THEN 5
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 165 THEN 4
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 150 THEN 3
            WHEN (CURRENT_DATE - cu.data_ultima_compra) > 120 THEN 2
            ELSE 1
        END) DESC, (CURRENT_DATE - cu.data_ultima_compra) DESC;
```

## public.vw_rodizio_bloqueios (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_rotation_state, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT s.customer_id,
    c.company_id,
    co.nome_crm AS company_nome,
    c.vendedor_id,
    c.vendedor_nome,
    s.bloqueado_ate,
    s.bloqueio_motivo,
    s.bloqueado_por_id,
    ub.name AS bloqueado_por_nome,
    s.bloqueio_aprovado_por_id,
    ua.name AS aprovado_por_nome,
        CASE
            WHEN s.bloqueado_ate IS NULL THEN 'NENHUM'::text
            WHEN s.bloqueado_ate < CURRENT_DATE THEN 'EXPIRADO'::text
            WHEN s.bloqueio_aprovado_por_id IS NULL THEN 'PENDENTE_APROVACAO'::text
            ELSE 'ATIVO'::text
        END AS status
   FROM customer_rotation_state s
     JOIN customers c ON c.id = s.customer_id AND c.deleted_at IS NULL
     JOIN companies co ON co.id = c.company_id
     LEFT JOIN users ub ON ub.id = s.bloqueado_por_id
     LEFT JOIN users ua ON ua.id = s.bloqueio_aprovado_por_id
  WHERE s.bloqueado_ate IS NOT NULL
  ORDER BY s.bloqueado_ate DESC;
```

## public.vw_rodizio_carga_closers (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customer_rotation_state, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT u.id AS closer_id,
    u.name AS closer_nome,
    u.is_active,
    u.ordem_rodizio,
    u.capacidade_max,
    u.afastado_ate,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text) AS total_ativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'INATIVO'::text) AS total_inativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'BLOQUEADO'::text) AS total_bloqueado,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'POOL_FRIO'::text) AS total_pool_frio,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = ANY (ARRAY['NAO_ATIVADO'::text, 'INATIVO'::text])) AS carga_atual,
    count(c.id) AS total_carteira
   FROM users u
     LEFT JOIN customers c ON c.vendedor_id = u.id AND c.deleted_at IS NULL
     LEFT JOIN customer_rotation_state crs ON crs.customer_id = c.id
  WHERE u.participa_rodizio_closer
  GROUP BY u.id, u.name, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate
  ORDER BY u.ordem_rodizio;
```

## public.vw_rodizio_carga_sdrs (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customer_rotation_state, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT u.id AS sdr_id,
    u.name AS sdr_nome,
    u.is_active,
    u.ordem_rodizio,
    u.capacidade_max,
    u.afastado_ate,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado,
    count(c.id) AS total_carteira
   FROM users u
     LEFT JOIN customers c ON c.sdr_id = u.id AND c.deleted_at IS NULL
     LEFT JOIN customer_rotation_state crs ON crs.customer_id = c.id
  WHERE u.participa_rodizio_sdr
  GROUP BY u.id, u.name, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate
  ORDER BY u.ordem_rodizio;
```

## public.vw_rodizio_execucoes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.rodizio_execucoes, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT e.id,
    e.tipo,
    e.modo,
    e.iniciado_em,
    e.finalizado_em,
    e.total_elegiveis,
    e.total_rotacionados,
    e.executado_por_id,
    u.name AS executado_por_nome,
    e.revertida_por_execucao_id,
    (EXISTS ( SELECT 1
           FROM rodizio_execucoes r2
          WHERE r2.revertida_por_execucao_id = e.id)) AS foi_revertida,
    e.parametros
   FROM rodizio_execucoes e
     LEFT JOIN users u ON u.id = e.executado_por_id
  ORDER BY e.iniciado_em DESC;
```

## public.vw_rodizio_kpis (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.customer_events, public.customer_ownership_history, public.customer_purchases, public.customer_rotation_state, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT u.id AS closer_id,
    u.name AS closer_nome,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text) AS total_ativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'INATIVO'::text) AS total_inativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'POOL_FRIO'::text) AS total_pool_frio,
    round(100.0 * count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text)::numeric / NULLIF(count(c.id), 0)::numeric, 1) AS taxa_ativacao_pct,
    ( SELECT count(*) AS count
           FROM customer_events ev
          WHERE ev.evento_tipo = 'RODIZIO_BLOQUEIO'::text AND ev.vendedor_id = u.id AND ev.data_evento >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS bloqueios_mes,
    ( SELECT count(*) AS count
           FROM customer_ownership_history h
          WHERE h.vendedor_id = u.id AND h.data_inicio >= (CURRENT_DATE - 30)) AS clientes_recebidos_30d,
    ( SELECT count(*) AS count
           FROM customer_purchases p
             JOIN customer_ownership_history h ON h.customer_id = p.customer_id AND h.vendedor_id = u.id
          WHERE p.vendedor_credito_id = u.id AND p.data_pedido >= h.data_inicio AND h.data_fim IS NULL) AS vendas_pos_rotacao
   FROM users u
     LEFT JOIN customers c ON c.vendedor_id = u.id AND c.deleted_at IS NULL
     LEFT JOIN customer_rotation_state crs ON crs.customer_id = c.id
  WHERE u.participa_rodizio_closer
  GROUP BY u.id, u.name, u.ordem_rodizio
  ORDER BY u.ordem_rodizio;
```

## public.vw_satisfaction_trend (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.satisfaction_scores, public.companies, public.contact_emails, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    ss.overall_score AS current_satisfaction,
    ss.nps_score AS current_nps,
    ss.nps_category,
    ss.collected_at AS last_survey_date,
    ( SELECT avg(satisfaction_scores.overall_score) AS avg
           FROM satisfaction_scores
          WHERE satisfaction_scores.contact_id = c.id) AS avg_satisfaction,
    ( SELECT avg(satisfaction_scores.nps_score) AS avg
           FROM satisfaction_scores
          WHERE satisfaction_scores.contact_id = c.id) AS avg_nps,
    ( SELECT count(*) AS count
           FROM satisfaction_scores
          WHERE satisfaction_scores.contact_id = c.id) AS total_surveys,
        CASE
            WHEN ss.overall_score::numeric > (( SELECT avg(satisfaction_scores.overall_score) AS avg
               FROM satisfaction_scores
              WHERE satisfaction_scores.contact_id = c.id)) THEN 'improving'::text
            WHEN ss.overall_score::numeric < (( SELECT avg(satisfaction_scores.overall_score) AS avg
               FROM satisfaction_scores
              WHERE satisfaction_scores.contact_id = c.id)) THEN 'declining'::text
            ELSE 'stable'::text
        END AS satisfaction_trend,
        CASE ss.nps_category
            WHEN 'detractor'::text THEN '🔴 Detrator - Ação urgente!'::text
            WHEN 'passive'::text THEN '🟡 Passivo - Oportunidade de melhoria'::text
            WHEN 'promoter'::text THEN '🟢 Promotor - Pedir indicação!'::text
            ELSE '⚪ Sem dados'::text
        END AS nps_alert
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN LATERAL ( SELECT satisfaction_scores.id,
            satisfaction_scores.contact_id,
            satisfaction_scores.company_id,
            satisfaction_scores.user_id,
            satisfaction_scores.overall_score,
            satisfaction_scores.product_score,
            satisfaction_scores.service_score,
            satisfaction_scores.support_score,
            satisfaction_scores.nps_score,
            satisfaction_scores.nps_category,
            satisfaction_scores.feedback_text,
            satisfaction_scores.improvement_suggestions,
            satisfaction_scores.survey_type,
            satisfaction_scores.survey_channel,
            satisfaction_scores.collected_at,
            satisfaction_scores.created_at
           FROM satisfaction_scores
          WHERE satisfaction_scores.contact_id = c.id
          ORDER BY satisfaction_scores.collected_at DESC
         LIMIT 1) ss ON true
  WHERE ss.id IS NOT NULL
  ORDER BY ss.overall_score;
```

## public.vw_sdr_closer_atual (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.sdr_closer_assignments, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT sdr.id AS sdr_id,
    sdr.name AS sdr_nome,
    closer.id AS closer_id,
    closer.name AS closer_nome,
    a.data_inicio,
    CURRENT_DATE - a.data_inicio AS dias_no_vinculo
   FROM sdr_closer_assignments a
     JOIN users sdr ON a.sdr_id = sdr.id
     JOIN users closer ON a.closer_id = closer.id
  WHERE a.data_fim IS NULL
  ORDER BY sdr.name, closer.name;
```

## public.vw_sdr_qtd_closers (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.sdr_closer_assignments, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT sdr.id AS sdr_id,
    sdr.name AS sdr_nome,
    count(a.closer_id) AS qtd_closers,
    string_agg(closer.name, ', '::text ORDER BY closer.name) AS closers
   FROM users sdr
     LEFT JOIN sdr_closer_assignments a ON sdr.id = a.sdr_id AND a.data_fim IS NULL
     LEFT JOIN users closer ON a.closer_id = closer.id
  WHERE sdr.is_sdr = true
  GROUP BY sdr.id, sdr.name
  ORDER BY sdr.name;
```

## public.vw_search_contacts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_emails, public.contact_phones, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id,
    c.full_name,
    c.nome_tratamento,
    c.relationship_stage,
    co.nome_crm AS company,
    ( SELECT cp.numero_normalizado
           FROM contact_phones cp
          WHERE cp.contact_id = c.id AND cp.is_primary = true
         LIMIT 1) AS phone,
    ( SELECT ce.email
           FROM contact_emails ce
          WHERE ce.contact_id = c.id AND ce.is_primary = true
         LIMIT 1) AS email
   FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
  WHERE c.deleted_at IS NULL AND c.is_duplicate = false;
```

## public.vw_singu_automation_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.automation_logs, public.automation_rules |
| populada | n/a |
| comentário | SINGU: Dashboard de automações e execuções |


```sql
SELECT user_id,
    id AS rule_id,
    name AS rule_name,
    trigger_type,
    is_active,
    execution_count,
    last_executed_at,
    last_error,
    ( SELECT count(*) AS count
           FROM automation_logs al
          WHERE al.rule_id = ar.id AND al.success = true) AS successful_runs,
    ( SELECT count(*) AS count
           FROM automation_logs al
          WHERE al.rule_id = ar.id AND al.success = false) AS failed_runs
   FROM automation_rules ar;
```

## public.vw_singu_communication_intel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.contact_preferences, public.contact_time_analysis, public.contacts |
| populada | n/a |
| comentário | SINGU: Inteligência de comunicação (horários e canais) |


```sql
SELECT cta.user_id,
    cta.contact_id,
    c.full_name AS contact_name,
    cta.day_of_week,
    cta.hour_of_day,
    cta.total_attempts,
    cta.success_count,
        CASE
            WHEN cta.total_attempts > 0 THEN round(cta.success_count::numeric / cta.total_attempts::numeric * 100::numeric, 1)
            ELSE 0::numeric
        END AS success_rate,
    cta.avg_response_time_minutes,
    cp.preferred_channel,
    cp.preferred_days,
    cp.avoid_days
   FROM contact_time_analysis cta
     JOIN contacts c ON c.id = cta.contact_id
     LEFT JOIN contact_preferences cp ON cp.contact_id = cta.contact_id AND cp.user_id = cta.user_id;
```

## public.vw_singu_contact_360 (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contact_cadence, public.contacts, public.disc_analysis_history, public.eq_analysis_history, public.health_alerts, public.hidden_objections, public.insights, public.interactions |
| populada | n/a |
| comentário | SINGU: Visão 360 do contato com DISC, EQ, cadência e alertas |


```sql
SELECT c.id AS contact_id,
    c.user_id,
    c.full_name,
    c.first_name,
    c.last_name,
    c.cargo,
    c.departamento,
    c.relationship_score,
    c.relationship_stage,
    c.sentiment,
    c.company_id,
    co.nome_crm AS company_name,
    co.cnpj AS company_cnpj,
    dah.primary_profile AS disc_primary,
    dah.secondary_profile AS disc_secondary,
    dah.blend_profile AS disc_blend,
    dah.confidence AS disc_confidence,
    dah.analyzed_at AS disc_analyzed_at,
    eah.overall_score AS eq_score,
    eah.overall_level AS eq_level,
    cc.cadence_days,
    cc.next_contact_due,
    cc.last_contact_at,
    ( SELECT count(*) AS count
           FROM interactions i
          WHERE i.contact_id = c.id AND i.user_id = c.user_id) AS interaction_count,
    ( SELECT count(*) AS count
           FROM insights ins
          WHERE ins.contact_id = c.id AND ins.user_id = c.user_id AND ins.dismissed = false) AS active_insights,
    ( SELECT count(*) AS count
           FROM hidden_objections ho
          WHERE ho.contact_id = c.id AND ho.user_id = c.user_id AND ho.resolved = false) AS open_objections,
    ( SELECT count(*) AS count
           FROM health_alerts ha
          WHERE ha.contact_id = c.id AND ha.user_id = c.user_id AND ha.dismissed = false) AS pending_health_alerts
   FROM contacts c
     LEFT JOIN companies co ON c.company_id = co.id
     LEFT JOIN LATERAL ( SELECT d.id,
            d.user_id,
            d.contact_id,
            d.interaction_id,
            d.primary_profile,
            d.secondary_profile,
            d.blend_profile,
            d.dominance_score,
            d.influence_score,
            d.steadiness_score,
            d.conscientiousness_score,
            d.confidence,
            d.stress_primary,
            d.stress_secondary,
            d.analysis_source,
            d.analyzed_text,
            d.analysis_notes,
            d.profile_summary,
            d.detected_keywords,
            d.detected_phrases,
            d.behavior_indicators,
            d.analyzed_at,
            d.created_at
           FROM disc_analysis_history d
          WHERE d.contact_id = c.id AND d.user_id = c.user_id
          ORDER BY d.analyzed_at DESC
         LIMIT 1) dah ON true
     LEFT JOIN LATERAL ( SELECT e.id,
            e.user_id,
            e.contact_id,
            e.interaction_id,
            e.overall_score,
            e.overall_level,
            e.confidence,
            e.pillar_scores,
            e.indicators,
            e.strengths,
            e.areas_for_growth,
            e.sales_implications,
            e.communication_style,
            e.profile_summary,
            e.analyzed_at,
            e.created_at
           FROM eq_analysis_history e
          WHERE e.contact_id = c.id AND e.user_id = c.user_id
          ORDER BY e.analyzed_at DESC
         LIMIT 1) eah ON true
     LEFT JOIN contact_cadence cc ON cc.contact_id = c.id AND cc.user_id = c.user_id
  WHERE c.deleted_at IS NULL;
```

## public.vw_singu_data_health (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | pg_catalog.pg_tables, pg_catalog.pg_views, public.automation_rules, public.companies, public.compatibility_settings, public.contacts, public.health_alert_settings, public.interactions |
| populada | n/a |
| comentário |  |


```sql
WITH metrics AS (
         SELECT (( SELECT count(*) AS count
                   FROM companies
                  WHERE companies.user_id IS NOT NULL))::numeric / NULLIF(( SELECT count(*) AS count
                   FROM companies), 0)::numeric * 100::numeric AS pct_companies_uid,
            (( SELECT count(*) AS count
                   FROM contacts
                  WHERE contacts.user_id IS NOT NULL AND contacts.deleted_at IS NULL))::numeric / NULLIF(( SELECT count(*) AS count
                   FROM contacts
                  WHERE contacts.deleted_at IS NULL), 0)::numeric * 100::numeric AS pct_contacts_uid,
            (( SELECT count(*) AS count
                   FROM companies
                  WHERE companies.cnpj IS NOT NULL AND companies.cnpj <> ''::text))::numeric / NULLIF(( SELECT count(*) AS count
                   FROM companies), 0)::numeric * 100::numeric AS pct_cnpj,
            ( SELECT count(*) AS count
                   FROM interactions) AS interactions_total,
            (( SELECT count(*) AS count
                   FROM pg_tables
                  WHERE pg_tables.schemaname = 'public'::name AND pg_tables.rowsecurity))::numeric / NULLIF(( SELECT count(*) AS count
                   FROM pg_tables
                  WHERE pg_tables.schemaname = 'public'::name), 0)::numeric * 100::numeric AS pct_rls,
            (( SELECT count(*) AS count
                   FROM pg_tables
                  WHERE pg_tables.schemaname = 'public'::name AND (pg_tables.tablename = ANY (ARRAY['disc_analysis_history'::text, 'disc_communication_logs'::text, 'disc_conversion_metrics'::text, 'eq_analysis_history'::text, 'cognitive_bias_history'::text, 'metaprogram_analysis'::text, 'emotional_states_history'::text, 'emotional_anchors'::text, 'hidden_objections'::text, 'decision_criteria'::text, 'client_values'::text, 'offer_suggestions'::text, 'insights'::text, 'contact_cadence'::text, 'contact_preferences'::text, 'communication_preferences'::text, 'contact_relatives'::text, 'contact_time_analysis'::text, 'life_events'::text, 'compatibility_alerts'::text, 'compatibility_settings'::text, 'health_alerts'::text, 'health_alert_settings'::text, 'automation_rules'::text, 'automation_logs'::text, 'lux_intelligence'::text, 'favorite_templates'::text, 'companies'::text, 'contacts'::text, 'interactions'::text, 'activities'::text, 'alerts'::text, 'disc_profile_config'::text]))))::numeric / 33::numeric * 100::numeric AS pct_singu,
            ( SELECT count(*) AS count
                   FROM compatibility_settings) AS s1,
            ( SELECT count(*) AS count
                   FROM health_alert_settings) AS s2,
            ( SELECT count(*) AS count
                   FROM automation_rules) AS s3,
            ( SELECT count(*) AS count
                   FROM pg_views
                  WHERE pg_views.schemaname = 'public'::name AND pg_views.viewname ~~ 'vw_singu_%'::text) AS vs,
            ( SELECT count(*) AS count
                   FROM pg_constraint c
                     JOIN pg_namespace n ON c.connamespace = n.oid
                  WHERE n.nspname = 'public'::name AND c.contype = 'c'::"char" AND c.conname ~~ 'chk_%'::text) AS chks,
            ( SELECT count(*) AS count
                   FROM pg_tables
                  WHERE pg_tables.schemaname = 'public'::name) AS tt,
            ( SELECT count(*) AS count
                   FROM pg_views
                  WHERE pg_views.schemaname = 'public'::name) AS tv
        ), scores AS (
         SELECT round(metrics_1.pct_companies_uid / 10::numeric, 1) AS score_user_id_companies,
            round(metrics_1.pct_contacts_uid / 10::numeric, 1) AS score_user_id_contacts,
            round(metrics_1.pct_cnpj / 10::numeric, 1) AS score_cnpj,
                CASE
                    WHEN metrics_1.interactions_total > 1000 THEN 10
                    WHEN metrics_1.interactions_total > 0 THEN 4
                    ELSE 0
                END AS score_interactions,
            round(metrics_1.pct_rls / 10::numeric, 1) AS score_rls,
            round(metrics_1.pct_singu / 10::numeric, 1) AS score_singu_tables,
                CASE
                    WHEN metrics_1.s1 > 0 AND metrics_1.s2 > 0 AND metrics_1.s3 > 0 THEN 10
                    ELSE 5
                END AS score_seeds,
                CASE
                    WHEN metrics_1.vs >= 9 THEN 10
                    WHEN metrics_1.vs >= 5 THEN 7
                    ELSE 3
                END AS score_views,
                CASE
                    WHEN metrics_1.chks >= 20 THEN 10
                    WHEN metrics_1.chks >= 10 THEN 7
                    ELSE 3
                END AS score_constraints
           FROM metrics metrics_1
        )
 SELECT NULL::uuid AS user_id,
    scores.score_user_id_companies,
    scores.score_user_id_contacts,
    scores.score_cnpj,
    scores.score_interactions,
    scores.score_rls,
    scores.score_singu_tables,
    scores.score_seeds,
    scores.score_views,
    scores.score_constraints,
    round((scores.score_user_id_companies + scores.score_user_id_contacts + scores.score_rls * 2::numeric + scores.score_singu_tables * 2::numeric + scores.score_interactions::numeric * 1.5 + scores.score_seeds::numeric * 0.5 + scores.score_views::numeric * 0.5 + scores.score_constraints::numeric * 0.5 + scores.score_cnpj * 0.5) / 9.5, 1) AS health_score,
    metrics.tt AS total_tables,
    metrics.tv AS total_views,
    metrics.interactions_total,
    metrics.s1 AS seeds_compat,
    metrics.s2 AS seeds_health,
    metrics.s3 AS seeds_auto,
    metrics.vs AS views_singu,
    metrics.chks AS check_constraints,
    now() AS measured_at
   FROM metrics
     CROSS JOIN scores;
```

## public.vw_singu_disc_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.disc_conversion_metrics, public.disc_profile_config |
| populada | n/a |
| comentário | SINGU: Dashboard de conversão por perfil DISC |


```sql
SELECT dcm.user_id,
    dcm.disc_profile,
    dcm.blend_profile,
    dcm.total_contacts,
    dcm.total_opportunities,
    dcm.converted_count,
    dcm.lost_count,
    dcm.conversion_rate,
    dcm.average_deal_size,
    dcm.average_sales_cycle_days,
    dcm.period_start,
    dcm.period_end,
    dpc.name AS profile_name,
    dpc.name_pt AS profile_name_pt,
    dpc.color AS profile_color,
    dpc.icon AS profile_icon
   FROM disc_conversion_metrics dcm
     LEFT JOIN disc_profile_config dpc ON dpc.profile_type = dcm.disc_profile;
```

## public.vw_singu_emotional_trend (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.contacts, public.emotional_states_history |
| populada | n/a |
| comentário | SINGU: Evolução emocional ao longo do tempo |


```sql
SELECT esh.user_id,
    esh.contact_id,
    c.full_name AS contact_name,
    esh.emotional_state,
    esh.confidence,
    esh.trigger,
    esh.context,
    esh.created_at,
    lag(esh.emotional_state) OVER (PARTITION BY esh.contact_id, esh.user_id ORDER BY esh.created_at) AS previous_state
   FROM emotional_states_history esh
     JOIN contacts c ON c.id = esh.contact_id;
```

## public.vw_singu_lux_status (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.contacts, public.lux_intelligence |
| populada | n/a |
| comentário | SINGU: Status de varreduras Lux Intelligence |


```sql
SELECT user_id,
    id AS scan_id,
    entity_id,
    entity_type,
    request_type,
    status,
    started_at,
    completed_at,
        CASE entity_type
            WHEN 'contact'::text THEN ( SELECT c.full_name
               FROM contacts c
              WHERE c.id = li.entity_id)
            WHEN 'company'::text THEN ( SELECT co.nome_crm
               FROM companies co
              WHERE co.id = li.entity_id)
            ELSE NULL::text
        END AS entity_name,
    error_message,
    created_at
   FROM lux_intelligence li
  ORDER BY created_at DESC;
```

## public.vw_singu_rapport_intel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.client_values, public.contact_relatives, public.contacts, public.emotional_anchors, public.life_events |
| populada | n/a |
| comentário | SINGU: Pontos de rapport para cada contato |


```sql
SELECT user_id,
    id AS contact_id,
    full_name,
    birthday,
    hobbies,
    interests_array AS interests,
    family_info,
    personal_notes,
    ( SELECT json_agg(json_build_object('title', le.title, 'event_type', le.event_type, 'event_date', le.event_date, 'recurring', le.recurring)) AS json_agg
           FROM life_events le
          WHERE le.contact_id = c.id AND le.user_id = c.user_id AND le.event_date >= CURRENT_DATE AND le.event_date <= (CURRENT_DATE + 30)) AS upcoming_events,
    ( SELECT json_agg(json_build_object('name', cr.name, 'relationship_type', cr.relationship_type, 'is_decision_influencer', cr.is_decision_influencer, 'birthday', cr.birthday)) AS json_agg
           FROM contact_relatives cr
          WHERE cr.contact_id = c.id AND cr.user_id = c.user_id) AS relatives,
    ( SELECT json_agg(json_build_object('value_name', cv.value_name, 'category', cv.category, 'importance', cv.importance)) AS json_agg
           FROM ( SELECT cv2.id,
                    cv2.user_id,
                    cv2.contact_id,
                    cv2.value_name,
                    cv2.category,
                    cv2.importance,
                    cv2.frequency,
                    cv2.detected_phrases,
                    cv2.last_mentioned,
                    cv2.created_at,
                    cv2.updated_at
                   FROM client_values cv2
                  WHERE cv2.contact_id = c.id AND cv2.user_id = c.user_id
                  ORDER BY cv2.importance DESC
                 LIMIT 5) cv) AS top_values,
    ( SELECT json_agg(json_build_object('trigger_word', ea.trigger_word, 'emotional_state', ea.emotional_state, 'strength', ea.strength)) AS json_agg
           FROM emotional_anchors ea
          WHERE ea.contact_id = c.id AND ea.user_id = c.user_id AND ea.anchor_type = 'positive'::text) AS positive_anchors
   FROM contacts c
  WHERE deleted_at IS NULL;
```

## public.vw_singu_readiness (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.activities, public.alerts, public.automation_logs, public.automation_rules, public.client_values, public.cognitive_bias_history, public.communication_preferences, public.companies, public.compatibility_alerts, public.compatibility_settings, public.contact_cadence, public.contact_preferences, public.contact_relatives, public.contact_time_analysis, public.contacts, public.decision_criteria, public.disc_analysis_history, public.disc_communication_logs, public.disc_conversion_metrics, public.disc_profile_config, public.emotional_anchors, public.emotional_states_history, public.eq_analysis_history, public.favorite_templates, public.health_alert_settings, public.health_alerts, public.hidden_objections, public.insights, public.interactions, public.life_events, public.lux_intelligence, public.metaprogram_analysis, public.offer_suggestions |
| populada | n/a |
| comentário |  |


```sql
WITH table_counts AS (
         SELECT 'disc_analysis_history'::text AS tabela,
            count(*) AS registros
           FROM disc_analysis_history
        UNION ALL
         SELECT 'disc_communication_logs'::text,
            count(*) AS count
           FROM disc_communication_logs
        UNION ALL
         SELECT 'disc_conversion_metrics'::text,
            count(*) AS count
           FROM disc_conversion_metrics
        UNION ALL
         SELECT 'eq_analysis_history'::text,
            count(*) AS count
           FROM eq_analysis_history
        UNION ALL
         SELECT 'cognitive_bias_history'::text,
            count(*) AS count
           FROM cognitive_bias_history
        UNION ALL
         SELECT 'metaprogram_analysis'::text,
            count(*) AS count
           FROM metaprogram_analysis
        UNION ALL
         SELECT 'emotional_states_history'::text,
            count(*) AS count
           FROM emotional_states_history
        UNION ALL
         SELECT 'emotional_anchors'::text,
            count(*) AS count
           FROM emotional_anchors
        UNION ALL
         SELECT 'hidden_objections'::text,
            count(*) AS count
           FROM hidden_objections
        UNION ALL
         SELECT 'decision_criteria'::text,
            count(*) AS count
           FROM decision_criteria
        UNION ALL
         SELECT 'client_values'::text,
            count(*) AS count
           FROM client_values
        UNION ALL
         SELECT 'offer_suggestions'::text,
            count(*) AS count
           FROM offer_suggestions
        UNION ALL
         SELECT 'insights'::text,
            count(*) AS count
           FROM insights
        UNION ALL
         SELECT 'contact_cadence'::text,
            count(*) AS count
           FROM contact_cadence
        UNION ALL
         SELECT 'contact_preferences'::text,
            count(*) AS count
           FROM contact_preferences
        UNION ALL
         SELECT 'communication_preferences'::text,
            count(*) AS count
           FROM communication_preferences
        UNION ALL
         SELECT 'contact_relatives'::text,
            count(*) AS count
           FROM contact_relatives
        UNION ALL
         SELECT 'contact_time_analysis'::text,
            count(*) AS count
           FROM contact_time_analysis
        UNION ALL
         SELECT 'life_events'::text,
            count(*) AS count
           FROM life_events
        UNION ALL
         SELECT 'compatibility_alerts'::text,
            count(*) AS count
           FROM compatibility_alerts
        UNION ALL
         SELECT 'compatibility_settings'::text,
            count(*) AS count
           FROM compatibility_settings
        UNION ALL
         SELECT 'health_alerts'::text,
            count(*) AS count
           FROM health_alerts
        UNION ALL
         SELECT 'health_alert_settings'::text,
            count(*) AS count
           FROM health_alert_settings
        UNION ALL
         SELECT 'automation_rules'::text,
            count(*) AS count
           FROM automation_rules
        UNION ALL
         SELECT 'automation_logs'::text,
            count(*) AS count
           FROM automation_logs
        UNION ALL
         SELECT 'lux_intelligence'::text,
            count(*) AS count
           FROM lux_intelligence
        UNION ALL
         SELECT 'favorite_templates'::text,
            count(*) AS count
           FROM favorite_templates
        UNION ALL
         SELECT 'companies (user_id)'::text,
            count(companies.user_id) AS count
           FROM companies
        UNION ALL
         SELECT 'contacts (user_id)'::text,
            count(contacts.user_id) AS count
           FROM contacts
        UNION ALL
         SELECT 'interactions'::text,
            count(*) AS count
           FROM interactions
        UNION ALL
         SELECT 'activities'::text,
            count(*) AS count
           FROM activities
        UNION ALL
         SELECT 'alerts'::text,
            count(*) AS count
           FROM alerts
        UNION ALL
         SELECT 'disc_profile_config'::text,
            count(*) AS count
           FROM disc_profile_config
        )
 SELECT tabela,
    registros,
        CASE
            WHEN (tabela = ANY (ARRAY['companies (user_id)'::text, 'contacts (user_id)'::text, 'disc_profile_config'::text])) AND registros > 0 THEN 'OK'::text
            WHEN tabela = 'interactions'::text AND registros = 0 THEN 'AGUARDANDO IMPORT'::text
            WHEN registros = 0 THEN 'PRONTO (vazio - sera populado pelo front)'::text
            ELSE 'OK'::text
        END AS status
   FROM table_counts
  ORDER BY tabela;
```

## public.vw_singu_usage_kpis (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.automation_rules, public.contacts, public.disc_analysis_history, public.eq_analysis_history, public.hidden_objections, public.insights, public.interactions, public.lux_intelligence, public.profiles |
| populada | n/a |
| comentário | SINGU: KPIs de uso do sistema por usuário |


```sql
SELECT id AS user_id,
    full_name AS user_name,
    plan,
    ( SELECT count(*) AS count
           FROM contacts c
          WHERE c.user_id = p.id AND c.deleted_at IS NULL) AS total_contacts,
    ( SELECT count(*) AS count
           FROM interactions i
          WHERE i.user_id = p.id) AS total_interactions,
    ( SELECT count(*) AS count
           FROM disc_analysis_history d
          WHERE d.user_id = p.id) AS disc_analyses,
    ( SELECT count(*) AS count
           FROM eq_analysis_history e
          WHERE e.user_id = p.id) AS eq_analyses,
    ( SELECT count(*) AS count
           FROM insights ins
          WHERE ins.user_id = p.id) AS total_insights,
    ( SELECT count(*) AS count
           FROM hidden_objections ho
          WHERE ho.user_id = p.id AND ho.resolved = false) AS open_objections,
    ( SELECT count(*) AS count
           FROM automation_rules ar
          WHERE ar.user_id = p.id AND ar.is_active = true) AS active_rules,
    ( SELECT count(*) AS count
           FROM lux_intelligence li
          WHERE li.user_id = p.id) AS lux_scans
   FROM profiles p
  WHERE is_active = true;
```

## public.vw_social_media_stats (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_social_media, public.contact_social_media, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT 'companies'::text AS entidade,
    count(DISTINCT c.id) AS total_registros,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'linkedin'::social_media_platform THEN csm.company_id
            ELSE NULL::uuid
        END) AS com_linkedin,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'instagram'::social_media_platform THEN csm.company_id
            ELSE NULL::uuid
        END) AS com_instagram,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'facebook'::social_media_platform THEN csm.company_id
            ELSE NULL::uuid
        END) AS com_facebook,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'x'::social_media_platform THEN csm.company_id
            ELSE NULL::uuid
        END) AS com_x,
    round(count(DISTINCT
        CASE
            WHEN csm.id IS NOT NULL THEN csm.company_id
            ELSE NULL::uuid
        END)::numeric / NULLIF(count(DISTINCT c.id), 0)::numeric * 100::numeric, 1) AS pct_com_alguma_rede
   FROM companies c
     LEFT JOIN company_social_media csm ON csm.company_id = c.id AND csm.is_active = true
  WHERE c.deleted_at IS NULL
UNION ALL
 SELECT 'contacts'::text AS entidade,
    count(DISTINCT ct.id) AS total_registros,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'linkedin'::social_media_platform THEN csm.contact_id
            ELSE NULL::uuid
        END) AS com_linkedin,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'instagram'::social_media_platform THEN csm.contact_id
            ELSE NULL::uuid
        END) AS com_instagram,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'facebook'::social_media_platform THEN csm.contact_id
            ELSE NULL::uuid
        END) AS com_facebook,
    count(DISTINCT
        CASE
            WHEN csm.plataforma = 'x'::social_media_platform THEN csm.contact_id
            ELSE NULL::uuid
        END) AS com_x,
    round(count(DISTINCT
        CASE
            WHEN csm.id IS NOT NULL THEN csm.contact_id
            ELSE NULL::uuid
        END)::numeric / NULLIF(count(DISTINCT ct.id), 0)::numeric * 100::numeric, 1) AS pct_com_alguma_rede
   FROM contacts ct
     LEFT JOIN contact_social_media csm ON csm.contact_id = ct.id AND csm.is_active = true
  WHERE ct.deleted_at IS NULL;
```

## public.vw_status_clientes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customers, public.users |
| populada | n/a |
| comentário |  |


```sql
SELECT cu.id AS customer_id,
    co.id AS company_id,
    co.nome_crm AS empresa,
    cu.cliente_ativado,
    cu.ja_comprou,
    cu.data_ultima_compra,
        CASE
            WHEN cu.cliente_ativado = true AND cu.ja_comprou = true THEN 'CLIENTE_ATIVO'::text
            WHEN cu.cliente_ativado = false AND cu.ja_comprou = true THEN 'EX_CLIENTE'::text
            WHEN cu.cliente_ativado = true AND cu.ja_comprou = false THEN 'PROSPECT_ATIVADO'::text
            WHEN cu.cliente_ativado = false AND cu.ja_comprou = false THEN 'PROSPECT'::text
            ELSE 'INDEFINIDO'::text
        END AS status_calculado,
    u.name AS vendedor_atual,
    cu.vendedor_id
   FROM customers cu
     JOIN companies co ON cu.company_id = co.id
     LEFT JOIN users u ON cu.vendedor_id = u.id;
```

## public.vw_supplier_alerts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.alerts, public.companies, public.suppliers |
| populada | n/a |
| comentário | Alertas ativos de fornecedores (supplier_*). FIX B3: filtra deleted_at IS NULL + ORDER BY corrigido. |


```sql
SELECT a.id AS alert_id,
    a.type,
    a.priority,
    a.title,
    a.message,
    a.status AS alert_status,
    a.metadata,
    a.created_at,
    a.read_at,
    co.nome_crm AS fornecedor,
    co.cnpj,
    s.homologado,
    s.score_geral
   FROM alerts a
     JOIN companies co ON co.id = a.company_id AND co.deleted_at IS NULL
     LEFT JOIN suppliers s ON s.company_id = a.company_id
  WHERE a.type ~~ 'supplier_%'::text
  ORDER BY (
        CASE a.priority
            WHEN 'critical'::text THEN 1
            WHEN 'high'::text THEN 2
            WHEN 'medium'::text THEN 3
            WHEN 'low'::text THEN 4
            ELSE 5
        END), a.created_at DESC;
```

## public.vw_supplier_by_state (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.supplier_scores, public.suppliers |
| populada | n/a |
| comentário |  |


```sql
SELECT COALESCE(addr.estado, 'SEM ESTADO'::character varying) AS estado,
    count(*) AS total,
    count(*) FILTER (WHERE s.homologado = true) AS homologados,
    count(*) FILTER (WHERE s.homologado = false) AS nao_homologados,
    round(avg(ss.score_geral), 2) AS score_medio,
    count(ss.supplier_id) AS com_avaliacao
   FROM suppliers s
     JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
     LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
     LEFT JOIN LATERAL ( SELECT ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = co.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  GROUP BY addr.estado
  ORDER BY (count(*)) DESC;
```

## public.vw_supplier_data_quality (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.company_emails, public.company_phones, public.contacts, public.suppliers |
| populada | n/a |
| comentário | Radiografia de qualidade de dados dos fornecedores: % com CNPJ, telefone, email, endereço, cadastro completo. |


```sql
SELECT count(*) AS total_fornecedores,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text) AS com_cnpj,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cnpj,
    count(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.razao_social <> ''::text) AS com_razao_social,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id))) AS com_telefone,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_telefone,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS com_email,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_email,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id))) AS com_endereco,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_endereco,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id))) AS com_contato,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_contato,
    count(*) FILTER (WHERE co.situacao_rf IS NOT NULL) AS com_situacao_rf,
    count(*) FILTER (WHERE NOT (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND NOT (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS sem_nenhum_contato,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id))) AS cadastro_completo,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cadastro_completo
   FROM suppliers s
     JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL;
```

## public.vw_supplier_evaluations_history (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.supplier_evaluations, public.suppliers, public.users |
| populada | n/a |
| comentário | Histórico de avaliações de fornecedores. FIX B3: filtra deleted_at IS NULL. |


```sql
SELECT co.nome_crm AS fornecedor,
    se.data_avaliacao,
    se.referencia,
    se.nota_preco,
    se.nota_prazo,
    se.nota_qualidade,
    se.nota_entrega,
    se.nota_geral,
    se.comentario,
    u.name AS avaliador,
    u.departamento AS departamento_avaliador,
    s.id AS supplier_id,
    s.company_id,
    se.id AS evaluation_id,
    se.created_at
   FROM supplier_evaluations se
     JOIN suppliers s ON s.id = se.supplier_id
     JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
     JOIN users u ON u.id = se.avaliador_id
  ORDER BY se.data_avaliacao DESC, se.created_at DESC;
```

## public.vw_supplier_homologation_control (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.supplier_homologations, public.suppliers, public.users |
| populada | n/a |
| comentário | Controle de homologação: status, dias para vencer, situação calculada, avaliador. Ordenado por prioridade de ação. |


```sql
SELECT co.nome_crm AS fornecedor,
    co.cnpj,
    s.homologado,
    sh.status AS ultimo_status,
    sh.data_solicitacao,
    sh.data_decisao,
    sh.validade,
        CASE
            WHEN sh.validade IS NULL THEN NULL::integer
            WHEN sh.validade < CURRENT_DATE THEN 0 - (CURRENT_DATE - sh.validade)
            ELSE sh.validade - CURRENT_DATE
        END AS dias_para_vencer,
        CASE
            WHEN sh.status IS NULL THEN 'NUNCA_SOLICITADA'::text
            WHEN sh.status = 'homologado'::supplier_homologation_status AND sh.validade < CURRENT_DATE THEN 'VENCIDA'::text
            WHEN sh.status = 'homologado'::supplier_homologation_status AND sh.validade >= CURRENT_DATE AND sh.validade <= (CURRENT_DATE + 30) THEN 'VENCENDO_EM_BREVE'::text
            WHEN sh.status = 'homologado'::supplier_homologation_status THEN 'VIGENTE'::text
            ELSE sh.status::text
        END AS situacao,
    u.name AS avaliador,
    sh.motivo_reprovacao,
    sh.observacoes,
    sh.criterios_checados,
    s.id AS supplier_id,
    s.company_id,
    sh.id AS homologation_id
   FROM suppliers s
     JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
     LEFT JOIN LATERAL ( SELECT sh2.id,
            sh2.supplier_id,
            sh2.status,
            sh2.avaliador_id,
            sh2.data_solicitacao,
            sh2.data_decisao,
            sh2.validade,
            sh2.criterios_checados,
            sh2.motivo_reprovacao,
            sh2.observacoes,
            sh2.created_at,
            sh2.updated_at
           FROM supplier_homologations sh2
          WHERE sh2.supplier_id = s.id
          ORDER BY sh2.created_at DESC
         LIMIT 1) sh ON true
     LEFT JOIN users u ON u.id = sh.avaliador_id
  ORDER BY (
        CASE
            WHEN sh.status IS NULL THEN 0
            WHEN sh.status = 'pendente'::supplier_homologation_status THEN 1
            WHEN sh.status = 'em_analise'::supplier_homologation_status THEN 2
            WHEN sh.status = 'homologado'::supplier_homologation_status AND sh.validade < CURRENT_DATE THEN 3
            ELSE 10
        END), co.nome_crm;
```

## public.vw_supplier_homologation_queue (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.company_emails, public.company_phones, public.supplier_homologations, public.suppliers |
| populada | n/a |
| comentário |  |


```sql
SELECT co.nome_crm AS fornecedor,
    co.cnpj,
    co.razao_social,
        CASE
            WHEN co.cnpj IS NOT NULL THEN true
            ELSE false
        END AS tem_cnpj,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM company_phones cp
              WHERE cp.company_id = co.id)) THEN true
            ELSE false
        END AS tem_telefone,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM company_emails ce
              WHERE ce.company_id = co.id)) THEN true
            ELSE false
        END AS tem_email,
    addr.cidade,
    addr.estado,
    sh.status AS ultimo_status,
    sh.motivo_reprovacao,
        CASE
            WHEN sh.id IS NULL THEN 'NUNCA_ANALISADO'::text
            WHEN sh.status = 'pendente'::supplier_homologation_status THEN 'AGUARDANDO_ANALISE'::text
            WHEN sh.status = 'em_analise'::supplier_homologation_status THEN 'EM_ANALISE'::text
            WHEN sh.status = 'reprovado'::supplier_homologation_status THEN 'REPROVADO_PENDENTE_REVISAO'::text
            WHEN sh.status = 'vencido'::supplier_homologation_status THEN 'VENCIDO_RENOVAR'::text
            ELSE 'OUTRO'::text
        END AS acao_necessaria,
        CASE
            WHEN sh.id IS NULL THEN 1
            WHEN sh.status = 'vencido'::supplier_homologation_status THEN 2
            WHEN sh.status = 'pendente'::supplier_homologation_status THEN 3
            WHEN sh.status = 'em_analise'::supplier_homologation_status THEN 4
            WHEN sh.status = 'reprovado'::supplier_homologation_status THEN 5
            ELSE 6
        END AS prioridade_ordem,
    s.id AS supplier_id,
    s.company_id
   FROM suppliers s
     JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
     LEFT JOIN LATERAL ( SELECT sh2.id,
            sh2.supplier_id,
            sh2.status,
            sh2.avaliador_id,
            sh2.data_solicitacao,
            sh2.data_decisao,
            sh2.validade,
            sh2.criterios_checados,
            sh2.motivo_reprovacao,
            sh2.observacoes,
            sh2.created_at,
            sh2.updated_at
           FROM supplier_homologations sh2
          WHERE sh2.supplier_id = s.id
          ORDER BY sh2.created_at DESC
         LIMIT 1) sh ON true
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = co.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE s.homologado = false
  ORDER BY (
        CASE
            WHEN sh.id IS NULL THEN 1
            WHEN sh.status = 'vencido'::supplier_homologation_status THEN 2
            WHEN sh.status = 'pendente'::supplier_homologation_status THEN 3
            WHEN sh.status = 'em_analise'::supplier_homologation_status THEN 4
            WHEN sh.status = 'reprovado'::supplier_homologation_status THEN 5
            ELSE 6
        END), co.nome_crm;
```

## public.vw_supplier_qualification_dashboard (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.supplier_evaluations, public.supplier_homologations, public.supplier_scores, public.suppliers |
| populada | n/a |
| comentário | Dashboard consolidado: totais, segmentos, tendências, homologações, avaliações. Consulta única para painel gerencial. |


```sql
SELECT count(*) AS total_fornecedores,
    count(*) FILTER (WHERE s.homologado = true) AS total_homologados,
    count(*) FILTER (WHERE s.homologado = false) AS total_nao_homologados,
    round(100.0 * count(*) FILTER (WHERE s.homologado = true)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_homologados,
    count(*) FILTER (WHERE ss.segment_code = 'excelente'::text) AS qtd_excelente,
    count(*) FILTER (WHERE ss.segment_code = 'bom'::text) AS qtd_bom,
    count(*) FILTER (WHERE ss.segment_code = 'regular'::text) AS qtd_regular,
    count(*) FILTER (WHERE ss.segment_code = 'insuficiente'::text) AS qtd_insuficiente,
    count(*) FILTER (WHERE ss.segment_code = 'critico'::text) AS qtd_critico,
    count(*) FILTER (WHERE ss.supplier_id IS NULL) AS qtd_sem_avaliacao,
    round(avg(ss.score_geral), 2) AS score_medio_geral,
    count(*) FILTER (WHERE ss.trend = 'melhorando'::text) AS qtd_melhorando,
    count(*) FILTER (WHERE ss.trend = 'estavel'::text) AS qtd_estavel,
    count(*) FILTER (WHERE ss.trend = 'piorando'::text) AS qtd_piorando,
    count(*) FILTER (WHERE hom.status = 'pendente'::supplier_homologation_status) AS homologacoes_pendentes,
    count(*) FILTER (WHERE hom.status = 'em_analise'::supplier_homologation_status) AS homologacoes_em_analise,
    count(*) FILTER (WHERE hom.validade < CURRENT_DATE) AS homologacoes_vencidas,
    count(*) FILTER (WHERE hom.validade >= CURRENT_DATE AND hom.validade <= (CURRENT_DATE + 30)) AS homologacoes_vencendo_30d,
    COALESCE(sum(ss.total_avaliacoes), 0::bigint) AS total_avaliacoes_realizadas,
    ( SELECT count(*) AS count
           FROM supplier_evaluations
          WHERE supplier_evaluations.data_avaliacao >= (CURRENT_DATE - 30)) AS avaliacoes_ultimos_30d
   FROM suppliers s
     JOIN companies c ON c.id = s.company_id AND c.deleted_at IS NULL
     LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
     LEFT JOIN LATERAL ( SELECT sh.status,
            sh.validade
           FROM supplier_homologations sh
          WHERE sh.supplier_id = s.id
          ORDER BY sh.created_at DESC
         LIMIT 1) hom ON true;
```

## public.vw_supplier_ranking (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.supplier_qualification_config, public.supplier_scores, public.suppliers |
| populada | n/a |
| comentário | Ranking de fornecedores por score_geral DESC. Inclui cor do segmento. |


```sql
SELECT rank() OVER (ORDER BY ss.score_geral DESC NULLS LAST) AS ranking,
    co.nome_crm AS fornecedor,
    co.cnpj,
    s.homologado,
    ss.score_geral,
    ss.score_preco,
    ss.score_prazo,
    ss.score_qualidade,
    ss.score_entrega,
    ss.classificacao,
    ss.segment_code,
    ss.trend,
    ss.total_avaliacoes,
    ss.ultima_avaliacao,
    ss.score_change,
    sqc.color AS segment_color,
    s.id AS supplier_id,
    s.company_id
   FROM suppliers s
     JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
     LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
     LEFT JOIN supplier_qualification_config sqc ON sqc.segment_code = ss.segment_code
  ORDER BY ss.score_geral DESC NULLS LAST;
```

## public.vw_timeline_cliente (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_events |
| populada | n/a |
| comentário |  |


```sql
SELECT ce.id,
    ce.customer_id,
    ce.company_id,
    ce.evento_tipo,
    ce.data_evento,
    ce.vendedor_id,
    ce.vendedor_nome,
    ce.executado_por_id,
    ce.executado_por_nome,
    ce.motivo,
    ce.observacoes,
    ce.dados_extras,
    ce.created_at,
    c.nome_crm AS empresa_nome,
    c.cnpj AS empresa_cnpj
   FROM customer_events ce
     LEFT JOIN companies c ON ce.company_id = c.id
  ORDER BY ce.data_evento DESC, ce.created_at DESC;
```

## public.vw_timeline_empresa (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_events |
| populada | n/a |
| comentário |  |


```sql
SELECT ce.id,
    ce.customer_id,
    ce.company_id,
    ce.evento_tipo,
    ce.data_evento,
    ce.vendedor_id,
    ce.vendedor_nome,
    ce.executado_por_id,
    ce.executado_por_nome,
    ce.motivo,
    ce.observacoes,
    ce.dados_extras,
    ce.created_at,
    c.nome_crm AS empresa_nome
   FROM customer_events ce
     LEFT JOIN companies c ON ce.company_id = c.id
  ORDER BY ce.company_id, ce.data_evento DESC;
```

## public.vw_todays_reminders (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | _dormant.smart_reminders, public.companies, public.contacts |
| populada | n/a |
| comentário |  |


```sql
SELECT sr.id,
    sr.user_id,
    sr.reminder_type,
    sr.title,
    sr.description,
    sr.remind_at,
    sr.priority,
    sr.contact_id,
    COALESCE(c.full_name, (c.first_name || ' '::text) || c.last_name) AS contact_name,
    sr.company_id,
    COALESCE(co.nome_crm, co.razao_social) AS company_name,
    sr.suggested_actions,
    sr.status,
    EXTRACT(epoch FROM sr.remind_at - now()) / 60::numeric AS minutes_until,
        CASE
            WHEN sr.remind_at < now() THEN '⏰ ATRASADO'::text
            WHEN sr.remind_at < (now() + '01:00:00'::interval) THEN '🔔 EM BREVE'::text
            ELSE '📅 Agendado'::text
        END AS time_status,
        CASE sr.priority
            WHEN 'urgent'::text THEN '🔴'::text
            WHEN 'high'::text THEN '🟠'::text
            WHEN 'normal'::text THEN '🔵'::text
            ELSE '⚪'::text
        END AS priority_icon
   FROM smart_reminders sr
     LEFT JOIN contacts c ON sr.contact_id = c.id
     LEFT JOIN companies co ON sr.company_id = co.id
  WHERE sr.status::text = 'pending'::text AND date(sr.remind_at) = CURRENT_DATE
  ORDER BY sr.remind_at;
```

## public.vw_top_clientes_vendedor (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.company_addresses, public.customers |
| populada | n/a |
| comentário |  |


```sql
SELECT cust.vendedor_id,
    cust.vendedor_nome,
    cust.id AS customer_id,
    cust.company_id,
    c.nome_crm AS empresa,
    addr.cidade,
    addr.estado,
    cust.cliente_ativado,
    cust.ja_comprou,
    cust.valor_total_compras,
    cust.total_pedidos,
    cust.ticket_medio,
    cust.data_primeira_compra,
    cust.data_ultima_compra,
    rank() OVER (PARTITION BY cust.vendedor_id ORDER BY cust.valor_total_compras DESC)::integer AS ranking_valor,
    round(cust.valor_total_compras * 100.0 / NULLIF(sum(cust.valor_total_compras) OVER (PARTITION BY cust.vendedor_id), 0::numeric), 1) AS pct_carteira
   FROM customers cust
     JOIN companies c ON c.id = cust.company_id
     LEFT JOIN LATERAL ( SELECT ca.cidade,
            ca.estado
           FROM company_addresses ca
          WHERE ca.company_id = c.id
          ORDER BY ca.is_primary DESC
         LIMIT 1) addr ON true
  WHERE c.deleted_at IS NULL AND cust.deleted_at IS NULL AND cust.cliente_ativado = true AND cust.ja_comprou = true AND cust.valor_total_compras > 0::numeric;
```

## public.vw_ultimo_inativador (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.companies, public.customer_events |
| populada | n/a |
| comentário |  |


```sql
SELECT DISTINCT ON (ce.customer_id) ce.customer_id,
    ce.company_id,
    c.nome_crm AS empresa,
    ce.executado_por_id AS ultimo_inativador_id,
    ce.executado_por_nome AS ultimo_inativador_nome,
    ce.data_evento AS data_ultima_inativacao,
    ce.motivo AS motivo_inativacao
   FROM customer_events ce
     LEFT JOIN companies c ON ce.company_id = c.id
  WHERE ce.evento_tipo = 'INATIVACAO'::text
  ORDER BY ce.customer_id, ce.data_evento DESC;
```

## public.vw_workspace_overview (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.workspace_accounts |
| populada | n/a |
| comentário |  |


```sql
SELECT email,
    display_name,
    account_type,
        CASE
            WHEN account_type = 'user'::workspace_account_type AND is_admin THEN '🔑 Admin'::text
            WHEN account_type = 'user'::workspace_account_type AND is_active THEN '✅ Ativo'::text
            WHEN account_type = 'user'::workspace_account_type AND is_suspended THEN '⛔ Suspenso'::text
            WHEN account_type = 'group'::workspace_account_type THEN ('👥 Grupo ('::text || member_count) || ')'::text
            ELSE '❓ Outro'::text
        END AS status,
    COALESCE(array_length(aliases, 1), 0) AS total_aliases,
    member_count,
    contact_id IS NOT NULL AS vinculado_contato,
    user_id IS NOT NULL AS vinculado_user,
    synced_at
   FROM workspace_accounts
  ORDER BY account_type, email;
```

## reporting.mv_daily_kpis (materialized)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | n/a |
| opções |  |
| depende de | public.companies, public.contacts, public.customers, public.interactions, public.salespeople |
| populada | sim |
| comentário | KPIs diários materializados para performance |


```sql
SELECT date_trunc('day'::text, now()) AS snapshot_date,
    ( SELECT count(*) AS count
           FROM companies
          WHERE companies.deleted_at IS NULL) AS total_companies,
    ( SELECT count(*) AS count
           FROM contacts
          WHERE contacts.deleted_at IS NULL) AS total_contacts,
    ( SELECT count(*) AS count
           FROM customers
          WHERE customers.deleted_at IS NULL) AS total_customers,
    ( SELECT count(*) AS count
           FROM customers
          WHERE customers.cliente_ativado = true AND customers.deleted_at IS NULL) AS active_customers,
    ( SELECT COALESCE(sum(customers.valor_total_compras), 0::numeric) AS "coalesce"
           FROM customers
          WHERE customers.deleted_at IS NULL) AS total_revenue,
    ( SELECT count(*) AS count
           FROM interactions
          WHERE interactions.created_at >= date_trunc('day'::text, now())) AS interactions_today,
    ( SELECT count(*) AS count
           FROM salespeople) AS total_salespeople;
```

## reporting.mv_daily_stats (materialized)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | n/a |
| opções |  |
| depende de | public.companies, public.contacts, public.deals, public.interactions, public.proposals, public.tasks |
| populada | sim |
| comentário |  |


```sql
SELECT CURRENT_DATE AS stats_date,
    ( SELECT count(*) AS count
           FROM companies
          WHERE companies.deleted_at IS NULL) AS total_companies,
    ( SELECT count(*) AS count
           FROM contacts
          WHERE contacts.deleted_at IS NULL) AS total_contacts,
    ( SELECT count(*) AS count
           FROM deals
          WHERE deals.status <> ALL (ARRAY['ganho'::text, 'perdido'::text, 'arquivado'::text])) AS open_deals,
    ( SELECT COALESCE(sum(deals.valor), 0::numeric) AS "coalesce"
           FROM deals
          WHERE deals.status <> ALL (ARRAY['ganho'::text, 'perdido'::text, 'arquivado'::text])) AS pipeline_value,
    ( SELECT count(*) AS count
           FROM deals
          WHERE deals.status = 'ganho'::text AND deals.closed_at >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS monthly_deals_won,
    ( SELECT COALESCE(sum(deals.valor), 0::numeric) AS "coalesce"
           FROM deals
          WHERE deals.status = 'ganho'::text AND deals.closed_at >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS monthly_revenue,
    ( SELECT count(*) AS count
           FROM interactions
          WHERE interactions.data_interacao >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS monthly_interactions,
    ( SELECT count(*) AS count
           FROM proposals
          WHERE proposals.created_at >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS monthly_proposals,
    ( SELECT count(*) AS count
           FROM tasks
          WHERE tasks.status = 'pending'::text AND tasks.due_date < CURRENT_DATE) AS overdue_tasks,
    ( SELECT count(*) AS count
           FROM interactions
          WHERE interactions.follow_up_date < CURRENT_DATE AND COALESCE(interactions.followup_concluido, false) = false) AS overdue_followups,
    now() AS calculated_at;
```

## zapp_history.contact_message_stats (materialized)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | n/a |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.conversation_daily_summaries, zapp_history.message_audio, zapp_history.message_links, zapp_history.message_media, zapp_history.messages |
| populada | sim |
| comentário | Estatísticas agregadas WhatsApp por contato. Refresh diário às 03h UTC. |


```sql
SELECT c.id AS contact_id,
    c.full_name,
    c.company_id,
    co.nome_crm AS company_name,
    count(m.id) AS total_messages,
    count(m.id) FILTER (WHERE m.direction = 'inbound'::text) AS inbound_count,
    count(m.id) FILTER (WHERE m.direction = 'outbound'::text) AS outbound_count,
    count(DISTINCT mm.id) AS total_media,
    count(DISTINCT ma.id) AS total_audios,
    count(DISTINCT ml.id) AS total_links,
    min(m.created_at) AS first_message_at,
    max(m.created_at) AS last_message_at,
    count(DISTINCT date((m.created_at AT TIME ZONE 'America/Sao_Paulo'::text))) AS active_days,
    avg(ma.duration_seconds) AS avg_audio_duration,
    sum(ma.duration_seconds) AS total_audio_seconds,
    count(DISTINCT cds.id) AS total_summaries,
    max(cds.summary_date) AS last_summary_date,
    avg(cds.sentiment_score) AS avg_sentiment_score,
    mode() WITHIN GROUP (ORDER BY cds.sentiment_overall) AS dominant_sentiment
   FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     LEFT JOIN zapp_history.messages m ON m.contact_id = c.id
     LEFT JOIN zapp_history.message_media mm ON mm.contact_id = c.id
     LEFT JOIN zapp_history.message_audio ma ON ma.contact_id = c.id
     LEFT JOIN zapp_history.message_links ml ON ml.contact_id = c.id
     LEFT JOIN zapp_history.conversation_daily_summaries cds ON cds.contact_id = c.id
  WHERE c.deleted_at IS NULL
  GROUP BY c.id, c.full_name, c.company_id, co.nome_crm;
```

## zapp_history.v_audit_intelligence (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    created_at,
    contact_id,
    direction,
    content,
    lead_score,
    primary_intent,
    funnel_stage,
    priority_quadrant,
    quarantined,
    bant_score ->> 'classification'::text AS bant_class,
    (bant_score ->> 'bant_total'::text)::integer AS bant_total,
    bant_score -> 'signals'::text AS bant_signals,
    bant_score ->> 'override_reason'::text AS override_reason,
    credibility ->> 'level'::text AS credibility_level,
    company_size ->> 'size'::text AS company_size,
    relationship_status ->> 'status'::text AS relationship_status,
    technical_interest ->> 'has_technical_interest'::text AS has_technical,
    delivery_preference ->> 'urgency'::text AS urgency,
    referral_source ->> 'source'::text AS referral,
    language_info ->> 'lang'::text AS lang,
    nlp_structured_order ->> 'product'::text AS product,
    nlp_structured_order ->> 'quantity'::text AS quantity,
    budget_detected,
    nlp_structured_order ? 'cnpj'::text AS has_cnpj
   FROM zapp_history.messages m
  ORDER BY created_at DESC;
```

## zapp_history.v_authority_funnel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT decision_authority ->> 'level'::text AS nivel_autoridade,
    count(*) AS total,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS fechou,
    round(100.0 * count(*) FILTER (WHERE funnel_stage = 'fechamento'::text)::numeric / NULLIF(count(*), 0)::numeric, 2) AS taxa_fechamento_pct
   FROM zapp_history.messages
  WHERE decision_authority IS NOT NULL
  GROUP BY (decision_authority ->> 'level'::text)
  ORDER BY (
        CASE decision_authority ->> 'level'::text
            WHEN 'total'::text THEN 1
            WHEN 'parcial'::text THEN 2
            WHEN 'compartilhada'::text THEN 3
            WHEN 'nenhuma'::text THEN 4
            ELSE NULL::integer
        END);
```

## zapp_history.v_bant_distribution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT bant_score ->> 'classification'::text AS classificacao,
    count(*) AS total,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg((bant_score ->> 'bant_total'::text)::integer)::numeric(5,2) AS score_bant_medio,
    avg((bant_score ->> 'budget'::text)::integer)::numeric(5,2) AS budget_medio,
    avg((bant_score ->> 'authority'::text)::integer)::numeric(5,2) AS authority_medio,
    avg((bant_score ->> 'need'::text)::integer)::numeric(5,2) AS need_medio,
    avg((bant_score ->> 'timeline'::text)::integer)::numeric(5,2) AS timeline_medio,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS fechou
   FROM zapp_history.messages
  WHERE bant_score IS NOT NULL
  GROUP BY (bant_score ->> 'classification'::text)
  ORDER BY (
        CASE bant_score ->> 'classification'::text
            WHEN 'SQL_sales_qualified'::text THEN 1
            WHEN 'MQL_marketing_qualified'::text THEN 2
            WHEN 'lead_aquecendo'::text THEN 3
            WHEN 'lead_frio'::text THEN 4
            WHEN 'nao_qualificado'::text THEN 5
            ELSE NULL::integer
        END);
```

## zapp_history.v_budget_sensitivity (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT budget_sensitivity ->> 'sensitivity'::text AS sensibilidade,
    count(*) AS total,
    count(DISTINCT contact_id) AS contatos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    avg(budget_detected)::numeric(14,2) AS ticket_medio,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS fechou
   FROM zapp_history.messages
  WHERE budget_sensitivity IS NOT NULL
  GROUP BY (budget_sensitivity ->> 'sensitivity'::text)
  ORDER BY (
        CASE budget_sensitivity ->> 'sensitivity'::text
            WHEN 'baixa'::text THEN 1
            WHEN 'media'::text THEN 2
            WHEN 'alta'::text THEN 3
            ELSE NULL::integer
        END);
```

## zapp_history.v_buying_triggers (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT unnest(buying_triggers) AS trigger,
    count(*) AS total_ocorrencias,
    count(DISTINCT contact_id) AS contatos_distintos,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    avg(budget_detected)::numeric(12,2) AS budget_medio,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS chegou_no_fechamento,
    count(*) FILTER (WHERE funnel_stage = 'proposta'::text) AS na_proposta
   FROM zapp_history.messages
  WHERE buying_triggers IS NOT NULL AND array_length(buying_triggers, 1) > 0
  GROUP BY (unnest(buying_triggers))
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_churn_alerts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.conversations, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id AS message_id,
    m.created_at AS detectado_em,
    ct.full_name AS contato,
    comp.razao_social AS empresa,
    conv.remote_jid AS whatsapp,
    m.churn_risk ->> 'risk'::text AS risco,
    (m.churn_risk ->> 'score'::text)::integer AS score_risco,
    m.churn_risk -> 'signals'::text AS sinais,
    "left"(m.content, 300) AS mensagem,
    m.nlp_sentiment AS sentimento,
    m.lead_score
   FROM zapp_history.messages m
     JOIN contacts ct ON ct.id = m.contact_id
     JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
     LEFT JOIN companies comp ON comp.id = m.company_id
  WHERE m.churn_risk IS NOT NULL AND ((m.churn_risk ->> 'risk'::text) = ANY (ARRAY['alto'::text, 'critico'::text]))
  ORDER BY ((m.churn_risk ->> 'score'::text)::integer) DESC, m.created_at DESC;
```

## zapp_history.v_company_sizes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT company_size ->> 'size'::text AS porte,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    avg(budget_detected)::numeric(14,2) AS ticket_medio,
    avg((nlp_structured_order ->> 'quantity'::text)::integer)::integer AS qty_media,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot
   FROM zapp_history.messages
  WHERE company_size IS NOT NULL
  GROUP BY (company_size ->> 'size'::text)
  ORDER BY (
        CASE company_size ->> 'size'::text
            WHEN 'enterprise'::text THEN 1
            WHEN 'grande'::text THEN 2
            WHEN 'media'::text THEN 3
            WHEN 'pequena'::text THEN 4
            ELSE NULL::integer
        END);
```

## zapp_history.v_competitor_alerts (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id AS message_id,
    m.created_at,
    ct.full_name AS contato,
    comp.razao_social AS empresa,
    m.competitor_mention ->> 'context'::text AS contexto,
    m.competitor_mention -> 'flags'::text AS flags,
    m.lead_score,
    m.funnel_stage,
    "left"(m.content, 200) AS preview,
        CASE m.competitor_mention ->> 'context'::text
            WHEN 'pressao_preco'::text THEN '💰 Cliente pressionando por preço - oferecer condição especial ou justificar valor'::text
            WHEN 'questiona_diferencial'::text THEN '🎯 Cliente comparando features - destacar diferenciais únicos'::text
            WHEN 'tem_fornecedor_atual'::text THEN '🔄 Cliente já tem fornecedor - trabalhar migração'::text
            ELSE '🔍 Cliente pesquisando mercado - educar sobre valor'::text
        END AS acao_sugerida
   FROM zapp_history.messages m
     JOIN contacts ct ON ct.id = m.contact_id
     LEFT JOIN companies comp ON comp.id = m.company_id
  WHERE m.competitor_mention IS NOT NULL
  ORDER BY m.created_at DESC;
```

## zapp_history.v_complexity_distribution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT order_complexity ->> 'level'::text AS complexidade,
    count(*) AS total_pedidos,
    avg((order_complexity ->> 'score'::text)::integer)::numeric(5,2) AS score_complex_medio,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    avg((nlp_structured_order ->> 'quantity'::text)::integer)::integer AS qty_media,
    avg(budget_detected)::numeric(12,2) AS ticket_medio
   FROM zapp_history.messages
  WHERE order_complexity IS NOT NULL
  GROUP BY (order_complexity ->> 'level'::text)
  ORDER BY (
        CASE order_complexity ->> 'level'::text
            WHEN 'simples'::text THEN 1
            WHEN 'medio'::text THEN 2
            WHEN 'complexo'::text THEN 3
            ELSE NULL::integer
        END);
```

## zapp_history.v_contact_360 (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, public.disc_analysis_history, public.eq_analysis_history, zapp_history.contact_message_stats, zapp_history.conversation_daily_summaries, zapp_history.conversations |
| populada | n/a |
| comentário | Visão 360 do contato: identidade + empresa + histórico WhatsApp + último sumário + última conversa + DISC + EQ. Single source of truth para tela de detalhe. |


```sql
SELECT c.id AS contact_id,
    c.full_name,
    c.first_name,
    c.last_name,
    c.cargo,
    c.departamento,
    c.cpf,
    c.data_nascimento,
    c.relationship_stage,
    c.relationship_score,
    c.sentiment AS contact_sentiment,
    c.tags_array AS contact_tags,
    c.behavior,
    c.notes,
    c.user_id AS owner_user_id,
    co.id AS company_id,
    co.nome_crm AS company_name,
    co.razao_social,
    co.cnpj,
    co.financial_health,
    cms.total_messages,
    cms.inbound_count,
    cms.outbound_count,
    cms.total_media,
    cms.total_audios,
    cms.total_links,
    cms.first_message_at,
    cms.last_message_at,
    cms.active_days,
    cms.total_audio_seconds,
    cms.total_summaries,
    cms.last_summary_date,
    cms.avg_sentiment_score AS whatsapp_avg_sentiment,
    cms.dominant_sentiment AS whatsapp_dominant_sentiment,
    ( SELECT jsonb_build_object('date', cds.summary_date, 'short', cds.summary_short, 'mood', cds.customer_mood, 'sentiment', cds.sentiment_overall, 'sentiment_score', cds.sentiment_score, 'conversion_signal', cds.conversion_signal, 'topics', cds.topics, 'intents', cds.intents, 'next_steps', cds.next_steps, 'pain_points', cds.customer_pain_points) AS jsonb_build_object
           FROM zapp_history.conversation_daily_summaries cds
          WHERE cds.contact_id = c.id
          ORDER BY cds.summary_date DESC
         LIMIT 1) AS latest_summary,
    ( SELECT jsonb_build_object('id', conv.id, 'status', conv.status, 'last_message_at', conv.last_message_at, 'last_message_preview', conv.last_message_preview, 'unread_count', conv.unread_count, 'priority', conv.priority, 'queue', conv.queue, 'assigned_to', conv.assigned_to) AS jsonb_build_object
           FROM zapp_history.conversations conv
          WHERE conv.contact_id = c.id
          ORDER BY conv.last_message_at DESC NULLS LAST
         LIMIT 1) AS latest_conversation,
    ( SELECT jsonb_build_object('primary', dah.primary_profile, 'secondary', dah.secondary_profile, 'blend', dah.blend_profile, 'd_score', dah.dominance_score, 'i_score', dah.influence_score, 's_score', dah.steadiness_score, 'c_score', dah.conscientiousness_score, 'confidence', dah.confidence, 'profile_summary', dah.profile_summary, 'analyzed_at', dah.analyzed_at) AS jsonb_build_object
           FROM disc_analysis_history dah
          WHERE dah.contact_id = c.id
          ORDER BY dah.analyzed_at DESC NULLS LAST, dah.created_at DESC
         LIMIT 1) AS latest_disc,
    ( SELECT jsonb_build_object('overall_score', eqh.overall_score, 'overall_level', eqh.overall_level, 'confidence', eqh.confidence, 'pillars', eqh.pillar_scores, 'strengths', eqh.strengths, 'growth_areas', eqh.areas_for_growth, 'analyzed_at', eqh.analyzed_at) AS jsonb_build_object
           FROM eq_analysis_history eqh
          WHERE eqh.contact_id = c.id
          ORDER BY eqh.analyzed_at DESC NULLS LAST, eqh.created_at DESC
         LIMIT 1) AS latest_eq,
    c.created_at AS contact_created_at,
    c.updated_at AS contact_updated_at
   FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     LEFT JOIN zapp_history.contact_message_stats cms ON cms.contact_id = c.id
  WHERE c.deleted_at IS NULL;
```

## zapp_history.v_conversas_aguardando (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.contacts, zapp_history.conversations, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT c.id AS conversation_id,
    c.contact_id,
    ct.full_name AS contato,
    c.remote_jid AS whatsapp,
    c.last_message_at AS ultima_msg,
    EXTRACT(epoch FROM now() - c.last_message_at)::integer AS aguardando_seg,
    EXTRACT(epoch FROM now() - c.last_message_at)::integer / 60 AS aguardando_min,
    c.unread_count,
    c.last_message_preview AS preview,
    ( SELECT max(messages.lead_score) AS max
           FROM zapp_history.messages
          WHERE messages.conversation_id = c.id) AS max_lead_score,
        CASE
            WHEN EXTRACT(epoch FROM now() - c.last_message_at) <= 1800::numeric THEN '🟢 ok'::text
            WHEN EXTRACT(epoch FROM now() - c.last_message_at) <= 3600::numeric THEN '🟡 atencao'::text
            WHEN EXTRACT(epoch FROM now() - c.last_message_at) <= 14400::numeric THEN '🟠 atrasado'::text
            ELSE '🔴 critico'::text
        END AS criticidade
   FROM zapp_history.conversations c
     JOIN contacts ct ON ct.id = c.contact_id
  WHERE c.status = 'open'::text AND c.unread_count > 0 AND (EXISTS ( SELECT 1
           FROM zapp_history.messages m
          WHERE m.conversation_id = c.id AND m.direction = 'inbound'::text AND m.created_at = c.last_message_at))
  ORDER BY (( SELECT max(messages.lead_score) AS max
           FROM zapp_history.messages
          WHERE messages.conversation_id = c.id)) DESC NULLS LAST, c.last_message_at;
```

## zapp_history.v_customization_demand (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
WITH expanded AS (
         SELECT messages.id,
            messages.contact_id,
            messages.lead_score,
            jsonb_array_elements_text(COALESCE(messages.customization_extracted -> 'colors'::text, '[]'::jsonb)) AS color,
            NULL::text AS material,
            NULL::text AS technique
           FROM zapp_history.messages
          WHERE messages.customization_extracted IS NOT NULL
        UNION ALL
         SELECT messages.id,
            messages.contact_id,
            messages.lead_score,
            NULL::text,
            jsonb_array_elements_text(COALESCE(messages.customization_extracted -> 'materials'::text, '[]'::jsonb)) AS jsonb_array_elements_text,
            NULL::text
           FROM zapp_history.messages
          WHERE messages.customization_extracted IS NOT NULL
        UNION ALL
         SELECT messages.id,
            messages.contact_id,
            messages.lead_score,
            NULL::text,
            NULL::text,
            jsonb_array_elements_text(COALESCE(messages.customization_extracted -> 'techniques'::text, '[]'::jsonb)) AS jsonb_array_elements_text
           FROM zapp_history.messages
          WHERE messages.customization_extracted IS NOT NULL
        )
 SELECT COALESCE(color, material, technique) AS atributo,
        CASE
            WHEN color IS NOT NULL THEN 'cor'::text
            WHEN material IS NOT NULL THEN 'material'::text
            ELSE 'tecnica'::text
        END AS categoria,
    count(*) AS total_pedidos,
    count(DISTINCT contact_id) AS contatos
   FROM expanded
  WHERE COALESCE(color, material, technique) IS NOT NULL
  GROUP BY (COALESCE(color, material, technique)), (
        CASE
            WHEN color IS NOT NULL THEN 'cor'::text
            WHEN material IS NOT NULL THEN 'material'::text
            ELSE 'tecnica'::text
        END)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_daily_cost (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.ai_cost_log |
| populada | n/a |
| comentário |  |


```sql
SELECT date_trunc('day'::text, occurred_at)::date AS day,
    function_name,
    model,
    count(*) AS calls,
    count(*) FILTER (WHERE success = true) AS successful,
    count(*) FILTER (WHERE success = false) AS failed,
    sum(input_tokens) AS input_tokens_total,
    sum(output_tokens) AS output_tokens_total,
    sum(cost_cents) / 100.0 AS cost_usd,
    avg(duration_seconds) AS avg_duration_s
   FROM zapp_history.ai_cost_log
  WHERE occurred_at > (now() - '30 days'::interval)
  GROUP BY (date_trunc('day'::text, occurred_at)::date), function_name, model
  ORDER BY (date_trunc('day'::text, occurred_at)::date) DESC, (sum(cost_cents) / 100.0) DESC;
```

## zapp_history.v_dashboard_atendimento (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.connector_log, zapp_history.conversations, zapp_history.message_audio, zapp_history.message_media, zapp_history.messages, zapp_history.v_pedidos_detectados |
| populada | n/a |
| comentário |  |


```sql
SELECT ( SELECT count(*) AS count
           FROM zapp_history.messages
          WHERE messages.created_at::date = CURRENT_DATE) AS msgs_hoje,
    ( SELECT count(*) AS count
           FROM zapp_history.messages
          WHERE messages.created_at::date = CURRENT_DATE AND messages.direction = 'inbound'::text) AS msgs_recebidas_hoje,
    ( SELECT count(*) AS count
           FROM zapp_history.messages
          WHERE messages.created_at::date = CURRENT_DATE AND messages.direction = 'outbound'::text) AS msgs_enviadas_hoje,
    ( SELECT count(*) AS count
           FROM zapp_history.conversations
          WHERE conversations.status = 'open'::text) AS conversas_abertas,
    ( SELECT count(*) AS count
           FROM zapp_history.conversations
          WHERE conversations.status = 'open'::text AND conversations.unread_count > 0) AS conversas_sem_resposta,
    ( SELECT count(*) AS count
           FROM zapp_history.conversations
          WHERE conversations.last_message_at > (now() - '01:00:00'::interval)) AS conversas_ativas_1h,
    ( SELECT count(*) AS count
           FROM zapp_history.v_pedidos_detectados
          WHERE v_pedidos_detectados.recebido_em::date = CURRENT_DATE) AS pedidos_detectados_hoje,
    ( SELECT count(*) AS count
           FROM zapp_history.v_pedidos_detectados
          WHERE v_pedidos_detectados.prioridade = 1 AND v_pedidos_detectados.recebido_em::date = CURRENT_DATE) AS pedidos_hot_hoje,
    ( SELECT count(*) AS count
           FROM zapp_history.v_pedidos_detectados
          WHERE v_pedidos_detectados.classificacao = '🔥 HOT'::text AND v_pedidos_detectados.recebido_em::date = CURRENT_DATE) AS leads_hot_hoje,
    ( SELECT count(*) AS count
           FROM zapp_history.message_audio
          WHERE message_audio.created_at::date = CURRENT_DATE) AS audios_hoje,
    ( SELECT count(*) AS count
           FROM zapp_history.message_media
          WHERE message_media.created_at::date = CURRENT_DATE) AS midias_hoje,
    ( SELECT count(*) AS count
           FROM connector_log
          WHERE connector_log.parse_error IS NOT NULL AND connector_log.created_at > (now() - '1 day'::interval)) AS erros_24h,
    ( SELECT count(*) AS count
           FROM zapp_history.messages
          WHERE messages.nlp_processed_at IS NULL AND messages.nlp_request_id IS NOT NULL) AS nlp_pendente,
    ( SELECT avg(messages.lead_score)::numeric(5,2) AS avg
           FROM zapp_history.messages
          WHERE messages.created_at::date = CURRENT_DATE AND messages.lead_score IS NOT NULL) AS media_lead_score_hoje,
    ( SELECT jsonb_object_agg(s.nlp_sentiment, s.cnt) AS jsonb_object_agg
           FROM ( SELECT messages.nlp_sentiment,
                    count(*) AS cnt
                   FROM zapp_history.messages
                  WHERE messages.created_at::date = CURRENT_DATE AND messages.nlp_sentiment IS NOT NULL
                  GROUP BY messages.nlp_sentiment) s) AS sentimentos_hoje,
    ( SELECT jsonb_object_agg(c.classificacao, c.cnt) AS jsonb_object_agg
           FROM ( SELECT v_pedidos_detectados.classificacao,
                    count(*) AS cnt
                   FROM zapp_history.v_pedidos_detectados
                  WHERE v_pedidos_detectados.recebido_em::date = CURRENT_DATE
                  GROUP BY v_pedidos_detectados.classificacao) c) AS leads_classificacao_hoje;
```

## zapp_history.v_delivery_distribution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT delivery_preference ->> 'method'::text AS metodo,
    delivery_preference ->> 'urgency'::text AS urgencia,
    count(*) AS total,
    avg(lead_score)::numeric(5,2) AS score_medio
   FROM zapp_history.messages
  WHERE delivery_preference IS NOT NULL
  GROUP BY (delivery_preference ->> 'method'::text), (delivery_preference ->> 'urgency'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_demanda_geografica (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT COALESCE(location_extracted ->> 'state'::text, 'nao_identificado'::text) AS uf,
    COALESCE(location_extracted ->> 'region'::text, 'nao_identificado'::text) AS regiao,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    count(*) FILTER (WHERE lead_score >= 60 AND lead_score < 80) AS leads_warm,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    sum(budget_detected)::numeric(14,2) AS budget_total,
    avg(budget_detected)::numeric(12,2) AS ticket_medio,
    count(*) FILTER (WHERE nlp_structured_order ? 'cnpj'::text) AS leads_b2b,
    array_agg(DISTINCT location_extracted ->> 'city'::text) FILTER (WHERE (location_extracted ->> 'city'::text) IS NOT NULL) AS cidades_atendidas
   FROM zapp_history.messages
  WHERE nlp_processed_at IS NOT NULL AND location_extracted IS NOT NULL
  GROUP BY (location_extracted ->> 'state'::text), (location_extracted ->> 'region'::text)
  ORDER BY (count(*) FILTER (WHERE lead_score >= 80)) DESC, (count(*)) DESC;
```

## zapp_history.v_demanda_por_cidade (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT location_extracted ->> 'city'::text AS cidade,
    location_extracted ->> 'state'::text AS uf,
    (location_extracted ->> 'is_capital'::text)::boolean AS capital,
    count(*) AS total_pedidos,
    count(DISTINCT contact_id) AS contatos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    sum(budget_detected)::numeric(14,2) AS budget_total
   FROM zapp_history.messages
  WHERE (location_extracted ->> 'city'::text) IS NOT NULL
  GROUP BY (location_extracted ->> 'city'::text), (location_extracted ->> 'state'::text), (location_extracted ->> 'is_capital'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_disc_distribution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT disc_profile ->> 'profile'::text AS perfil,
    disc_profile ->> 'description'::text AS descricao,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    avg(budget_detected)::numeric(12,2) AS ticket_medio,
    array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas_observadas
   FROM zapp_history.messages
  WHERE disc_profile IS NOT NULL
  GROUP BY (disc_profile ->> 'profile'::text), (disc_profile ->> 'description'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_disc_funnel_matrix (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT disc_profile ->> 'profile'::text AS perfil_disc,
    funnel_stage AS etapa_funil,
    count(*) AS total,
    avg(lead_score)::numeric(5,2) AS score_medio
   FROM zapp_history.messages
  WHERE disc_profile IS NOT NULL AND funnel_stage IS NOT NULL
  GROUP BY (disc_profile ->> 'profile'::text), funnel_stage
  ORDER BY (disc_profile ->> 'profile'::text), funnel_stage;
```

## zapp_history.v_emotional_states (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT emotional_state ->> 'dominant'::text AS estado,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    count(*) FILTER (WHERE churn_risk IS NOT NULL) AS com_churn_risco,
    array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas_funil
   FROM zapp_history.messages
  WHERE emotional_state IS NOT NULL
  GROUP BY (emotional_state ->> 'dominant'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_eventos_demanda (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT event_type AS tipo_evento,
    count(*) AS total_pedidos,
    count(DISTINCT contact_id) AS contatos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    avg((nlp_structured_order ->> 'quantity'::text)::integer)::integer AS qty_media,
    sum(budget_detected)::numeric(14,2) AS budget_total,
    array_agg(DISTINCT nlp_structured_order ->> 'product'::text) FILTER (WHERE (nlp_structured_order ->> 'product'::text) IS NOT NULL) AS produtos_pedidos
   FROM zapp_history.messages
  WHERE event_type IS NOT NULL
  GROUP BY event_type
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_full_intelligence_stream (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id AS message_id,
    m.created_at,
    ct.full_name AS contato,
    comp.razao_social AS empresa,
    m.content AS preview,
    m.lead_score,
        CASE
            WHEN m.lead_score >= 80 THEN 'HOT'::text
            WHEN m.lead_score >= 60 THEN 'WARM'::text
            WHEN m.lead_score >= 40 THEN 'LUKEWARM'::text
            ELSE 'COLD'::text
        END AS classificacao,
    m.priority_quadrant,
    m.funnel_stage,
    m.journey_stage,
    m.primary_intent,
    m.customer_type,
    m.speaker_role,
    m.disc_profile ->> 'profile'::text AS disc,
    m.company_size ->> 'size'::text AS porte,
    m.relationship_status ->> 'status'::text AS relacao,
    m.emotional_state ->> 'dominant'::text AS emocao,
    m.communication_tone ->> 'tone'::text AS tom,
    m.language_info ->> 'lang'::text AS idioma,
    m.hesitation ->> 'level'::text AS hesit,
    m.budget_sensitivity ->> 'sensitivity'::text AS sens_budget,
    m.credibility ->> 'level'::text AS credibilidade,
    m.nlp_structured_order ->> 'product'::text AS produto,
    m.nlp_structured_order ->> 'quantity'::text AS qty,
    m.budget_detected AS budget,
    m.topics,
    m.seasonality,
    m.payment_preferences,
    m.competitor_mention ->> 'context'::text AS concorrente,
    m.objections,
    m.buying_triggers,
    m.churn_risk ->> 'risk'::text AS churn,
    m.suggested_response_at AS responder_ate,
    m.quarantined
   FROM zapp_history.messages m
     LEFT JOIN contacts ct ON ct.id = m.contact_id
     LEFT JOIN companies comp ON comp.id = m.company_id
  WHERE m.direction = 'inbound'::text AND m.nlp_processed_at IS NOT NULL
  ORDER BY m.created_at DESC;
```

## zapp_history.v_funil_origem (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário | Analítico de origem dos leads por canal de descoberta. Mostra qual canal traz leads mais quentes e maior budget. |


```sql
SELECT COALESCE(discovery_channel, 'nao_identificado'::text) AS canal,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    count(*) FILTER (WHERE lead_score >= 60 AND lead_score <= 79) AS leads_warm,
    count(*) FILTER (WHERE lead_score >= 40 AND lead_score <= 59) AS leads_lukewarm,
    count(*) FILTER (WHERE lead_score < 40 OR lead_score IS NULL) AS leads_cold,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    avg(budget_detected)::numeric(12,2) AS budget_medio,
    sum(budget_detected)::numeric(14,2) AS budget_total_detectado,
    count(*) FILTER (WHERE nlp_structured_order ? 'cnpj'::text) AS leads_b2b,
    min(created_at) AS primeira_msg,
    max(created_at) AS ultima_msg
   FROM zapp_history.messages
  WHERE nlp_processed_at IS NOT NULL
  GROUP BY discovery_channel
  ORDER BY (count(*) FILTER (WHERE lead_score >= 80)) DESC, (count(*)) DESC;
```

## zapp_history.v_funil_vendas (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
WITH stages AS (
         SELECT 'descoberta'::text AS stage,
            1 AS ordem
        UNION ALL
         SELECT 'interesse'::text,
            2
        UNION ALL
         SELECT 'cotacao'::text,
            3
        UNION ALL
         SELECT 'proposta'::text,
            4
        UNION ALL
         SELECT 'negociacao'::text,
            5
        UNION ALL
         SELECT 'fechamento'::text,
            6
        )
 SELECT s.stage AS etapa,
    s.ordem,
    count(m.id) AS total_mensagens,
    count(DISTINCT m.contact_id) AS contatos_unicos,
    avg(m.lead_score)::numeric(5,2) AS lead_score_medio,
    sum(m.budget_detected)::numeric(14,2) AS budget_total,
    count(*) FILTER (WHERE m.nlp_sentiment = 'urgent'::text) AS urgentes,
    count(*) FILTER (WHERE m.objections IS NOT NULL) AS com_objecoes
   FROM stages s
     LEFT JOIN zapp_history.messages m ON m.funnel_stage = s.stage
  GROUP BY s.stage, s.ordem
  ORDER BY s.ordem;
```

## zapp_history.v_hesitation_funnel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT hesitation ->> 'level'::text AS nivel_hesitacao,
    count(*) AS total,
    count(DISTINCT contact_id) AS contatos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas
   FROM zapp_history.messages
  WHERE hesitation IS NOT NULL
  GROUP BY (hesitation ->> 'level'::text)
  ORDER BY (
        CASE hesitation ->> 'level'::text
            WHEN 'alta'::text THEN 1
            WHEN 'media'::text THEN 2
            WHEN 'baixa'::text THEN 3
            ELSE 4
        END);
```

## zapp_history.v_intelligence_360 (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.conversations, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id AS message_id,
    m.created_at AS recebido_em,
    m.direction,
    m.in_business_hours,
    m.day_of_week,
    EXTRACT(hour FROM (m.created_at AT TIME ZONE 'America/Sao_Paulo'::text))::integer AS hora_local,
    ct.id AS contact_id,
    ct.full_name AS contato,
    ct.tags_array AS contato_tags,
    comp.id AS company_id,
    comp.razao_social AS empresa,
    comp.cnpj AS empresa_cnpj,
    conv.id AS conversation_id,
    conv.remote_jid AS whatsapp,
    conv.first_response_seconds AS primeira_resposta_seg,
    conv.sla_status,
    conv.unread_count,
    "left"(m.content, 500) AS mensagem,
    m.message_type,
    m.nlp_sentiment AS sentimento,
    m.nlp_sentiment_score AS confianca_sentimento,
    m.nlp_structured_order AS pedido_completo,
    m.nlp_structured_order ->> 'product'::text AS produto,
    (m.nlp_structured_order ->> 'quantity'::text)::integer AS quantidade,
    m.nlp_structured_order ->> 'deadline'::text AS prazo,
    m.nlp_structured_order ->> 'cnpj'::text AS cnpj_mencionado,
    m.budget_detected AS budget,
    m.discovery_channel AS canal_descoberta,
    m.objections AS objecoes,
    m.funnel_stage AS etapa_funil,
    m.customer_type AS tipo_cliente,
    m.event_type AS tipo_evento,
    m.communication_tone ->> 'tone'::text AS tom,
    m.location_extracted ->> 'city'::text AS cidade,
    m.location_extracted ->> 'state'::text AS uf,
    m.contact_info_extracted AS contato_info,
    m.buying_triggers AS gatilhos_compra,
    m.churn_risk ->> 'risk'::text AS risco_churn,
    (m.churn_risk ->> 'score'::text)::integer AS score_churn,
    m.disc_profile ->> 'dominant'::text AS perfil_disc,
    m.disc_profile ->> 'recommended_approach'::text AS abordagem_disc,
    m.payment_preferences,
    m.customization_extracted,
    m.lead_score,
    m.lead_score_breakdown,
        CASE
            WHEN (m.churn_risk ->> 'risk'::text) = ANY (ARRAY['alto'::text, 'critico'::text]) THEN '⛔ CHURN'::text
            WHEN m.lead_score >= 80 THEN '🔥 HOT'::text
            WHEN m.lead_score >= 60 THEN '🌶️ WARM'::text
            WHEN m.lead_score >= 40 THEN '💧 LUKEWARM'::text
            WHEN m.lead_score IS NULL THEN '❓ SEM SCORE'::text
            ELSE '❄️ COLD'::text
        END AS classificacao,
        CASE
            WHEN (m.churn_risk ->> 'risk'::text) = 'critico'::text THEN 0
            WHEN (m.churn_risk ->> 'risk'::text) = 'alto'::text THEN 1
            WHEN m.lead_score >= 80 THEN 1
            WHEN m.lead_score >= 60 THEN 2
            WHEN m.lead_score >= 40 THEN 3
            ELSE 4
        END AS prioridade,
        CASE
            WHEN (m.churn_risk ->> 'risk'::text) = 'critico'::text THEN '⛔ CHURN CRÍTICO - escalar para gerência IMEDIATAMENTE. Ligar agora.'::text
            WHEN (m.churn_risk ->> 'risk'::text) = 'alto'::text THEN '⚠️ CHURN ALTO - resposta empática em < 15min. Pedir desculpas + solução concreta.'::text
            WHEN ('budget_aprovado'::text = ANY (m.buying_triggers)) AND ('decisao_tomada'::text = ANY (m.buying_triggers)) THEN '💰 LEAD QUENTÍSSIMO - cliente pronto pra fechar. Enviar proposta formal HOJE.'::text
            WHEN 'troca_fornecedor'::text = ANY (m.buying_triggers) THEN '🎯 CLIENTE EM TROCA - destacar diferenciais vs antigo fornecedor.'::text
            WHEN 'licitacao'::text = ANY (m.buying_triggers) THEN '📋 LICITAÇÃO - verificar prazos do edital, enviar documentação técnica.'::text
            WHEN 'recorrente'::text = ANY (m.buying_triggers) THEN '♻️ RECOMPRA - puxar histórico, agilizar pedido idêntico.'::text
            WHEN (m.disc_profile ->> 'dominant'::text) = 'D'::text THEN '🎯 PERFIL D - direto e objetivo. Mande proposta sem rodeios, foque em prazo e ROI.'::text
            WHEN (m.disc_profile ->> 'dominant'::text) = 'I'::text THEN '🎉 PERFIL I - caloroso. Use storytelling, mostre cases, fotos de eventos.'::text
            WHEN (m.disc_profile ->> 'dominant'::text) = 'S'::text THEN '🤝 PERFIL S - construa relação, dê garantias, evite pressão.'::text
            WHEN (m.disc_profile ->> 'dominant'::text) = 'C'::text THEN '📊 PERFIL C - mande ficha técnica, certificados, especificações detalhadas.'::text
            WHEN m.nlp_sentiment = 'urgent'::text AND m.lead_score >= 80 THEN '🚨 ATENDER AGORA - lead quente urgente'::text
            WHEN m.lead_score >= 80 AND (m.funnel_stage = ANY (ARRAY['proposta'::text, 'negociacao'::text])) THEN '💰 Fechar proposta'::text
            WHEN m.funnel_stage = 'fechamento'::text THEN '✅ Confirmar fechamento - enviar boleto/pix'::text
            WHEN 'preco_alto'::text = ANY (m.objections) THEN '🎯 Oferecer desconto ou parcelamento'::text
            WHEN 'concorrencia'::text = ANY (m.objections) THEN '🏆 Destacar diferenciais vs concorrente'::text
            WHEN 'aprovacao_interna'::text = ANY (m.objections) THEN '📋 Preparar material pro decisor interno'::text
            WHEN 'forma_pagamento'::text = ANY (m.objections) THEN '💳 Enviar condições de pagamento'::text
            WHEN 'indecisao'::text = ANY (m.objections) THEN '🎣 Follow-up em 2 dias'::text
            WHEN m.customer_type = 'revendedor'::text THEN '🏪 REVENDEDOR - tabela atacado'::text
            WHEN m.customer_type = 'b2c'::text AND m.event_type IS NOT NULL THEN ('🎉 B2C '::text || m.event_type) || ' - tom acolhedor'::text
            WHEN m.funnel_stage = 'descoberta'::text THEN '👋 Qualificar lead'::text
            WHEN m.funnel_stage = 'interesse'::text THEN '📝 Enviar catálogo'::text
            WHEN m.funnel_stage = 'cotacao'::text THEN '💼 Preparar proposta'::text
            ELSE '📬 Responder em tempo hábil'::text
        END AS acao_recomendada,
    m.raw_payload ->> 'singu_interaction_id'::text AS singu_interaction_id
   FROM zapp_history.messages m
     JOIN contacts ct ON ct.id = m.contact_id
     JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
     LEFT JOIN companies comp ON comp.id = m.company_id
  WHERE m.nlp_processed_at IS NOT NULL
  ORDER BY (
        CASE
            WHEN (m.churn_risk ->> 'risk'::text) = 'critico'::text THEN 0
            ELSE 1
        END), m.lead_score DESC NULLS LAST, m.created_at DESC;
```

## zapp_history.v_intents_distribution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT primary_intent AS intencao,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    count(*) FILTER (WHERE churn_risk IS NOT NULL) AS com_churn,
    array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas
   FROM zapp_history.messages
  WHERE primary_intent IS NOT NULL
  GROUP BY primary_intent
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_journey_funnel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
WITH stages AS (
         SELECT 'TOFU'::text AS stage,
            1 AS ordem,
            'Topo - descobrindo'::text AS jdesc
        UNION ALL
         SELECT 'MOFU'::text,
            2,
            'Meio - comparando'::text
        UNION ALL
         SELECT 'BOFU'::text,
            3,
            'Fundo - pronto pra comprar'::text
        )
 SELECT s.stage AS etapa,
    s.ordem,
    s.jdesc AS descricao,
    count(m.id) AS total_mensagens,
    count(DISTINCT m.contact_id) AS contatos_unicos,
    avg(m.lead_score)::numeric(5,2) AS score_medio,
    sum(m.budget_detected)::numeric(14,2) AS budget_total,
    count(*) FILTER (WHERE m.lead_score >= 80) AS leads_hot
   FROM stages s
     LEFT JOIN zapp_history.messages m ON m.journey_stage = s.stage
  GROUP BY s.stage, s.ordem, s.jdesc
  ORDER BY s.ordem;
```

## zapp_history.v_language_distribution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT language_info ->> 'lang'::text AS idioma,
    language_info ->> 'dialect'::text AS dialeto,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio
   FROM zapp_history.messages
  WHERE language_info IS NOT NULL
  GROUP BY (language_info ->> 'lang'::text), (language_info ->> 'dialect'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_melhores_horarios (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT day_of_week AS dia_semana,
    EXTRACT(hour FROM (created_at AT TIME ZONE 'America/Sao_Paulo'::text))::integer AS hora,
    count(*) AS volume,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    avg(lead_score)::numeric(5,2) AS score_medio
   FROM zapp_history.messages
  WHERE direction = 'inbound'::text AND day_of_week IS NOT NULL
  GROUP BY day_of_week, (EXTRACT(hour FROM (created_at AT TIME ZONE 'America/Sao_Paulo'::text)))
 HAVING count(*) >= 1
  ORDER BY (count(*) FILTER (WHERE lead_score >= 80)) DESC, (count(*)) DESC
 LIMIT 20;
```

## zapp_history.v_objecoes_recorrentes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário | Top objeções extraídas automaticamente das conversas. Mostra qual objeção aparece mais e em qual etapa do funil. |


```sql
SELECT unnest(objections) AS objecao,
    count(*) AS total_ocorrencias,
    count(DISTINCT contact_id) AS contatos_distintos,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS apareceu_no_fechamento,
    count(*) FILTER (WHERE funnel_stage = 'negociacao'::text) AS apareceu_na_negociacao,
    array_agg(DISTINCT funnel_stage) AS etapas_observadas
   FROM zapp_history.messages
  WHERE objections IS NOT NULL AND array_length(objections, 1) > 0
  GROUP BY (unnest(objections))
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_payment_preferences (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT unnest(payment_preferences) AS forma_pagamento,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    sum(budget_detected)::numeric(14,2) AS valor_total_mencionado
   FROM zapp_history.messages
  WHERE payment_preferences IS NOT NULL
  GROUP BY (unnest(payment_preferences))
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_pedidos_detectados (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.conversations, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id AS message_id,
    m.created_at AS recebido_em,
    c.full_name AS contato,
    c.id AS contact_id,
    comp.razao_social AS empresa,
    m.content AS mensagem_original,
    m.nlp_sentiment AS urgencia,
    m.nlp_sentiment_score AS confianca,
    m.lead_score,
    m.lead_score_breakdown,
    m.nlp_structured_order ->> 'product'::text AS produto,
    (m.nlp_structured_order ->> 'quantity'::text)::integer AS quantidade,
    m.nlp_structured_order ->> 'deadline'::text AS prazo,
    m.nlp_structured_order ->> 'cnpj'::text AS cnpj,
    m.nlp_entities AS entidades_completas,
    m.raw_payload ->> 'singu_interaction_id'::text AS singu_interaction_id,
    conv.remote_jid AS whatsapp,
        CASE
            WHEN m.lead_score >= 80 THEN 1
            WHEN m.lead_score >= 60 THEN 2
            WHEN m.lead_score >= 40 THEN 3
            ELSE 4
        END AS prioridade,
        CASE
            WHEN m.lead_score >= 80 THEN '🔥 HOT'::text
            WHEN m.lead_score >= 60 THEN '🌶️ WARM'::text
            WHEN m.lead_score >= 40 THEN '💧 LUKEWARM'::text
            ELSE '❄️ COLD'::text
        END AS classificacao
   FROM zapp_history.messages m
     JOIN contacts c ON c.id = m.contact_id
     LEFT JOIN companies comp ON comp.id = m.company_id
     JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
  WHERE m.nlp_structured_order IS NOT NULL AND m.nlp_structured_order <> '{}'::jsonb AND m.nlp_structured_order ? 'product'::text
  ORDER BY m.lead_score DESC NULLS LAST, m.created_at DESC;
```

## zapp_history.v_pipeline_pending (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.conversation_daily_summaries, zapp_history.message_audio, zapp_history.message_links, zapp_history.message_media, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT 'media_download'::text AS pipeline,
    count(*) AS pending,
    count(*) FILTER (WHERE message_media.download_attempts >= 3) AS stuck
   FROM zapp_history.message_media
  WHERE (message_media.download_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND message_media.download_attempts < 5
UNION ALL
 SELECT 'audio_transcription'::text AS pipeline,
    count(*) AS pending,
    count(*) FILTER (WHERE message_audio.transcription_attempts >= 3) AS stuck
   FROM zapp_history.message_audio
  WHERE (message_audio.transcription_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND message_audio.transcription_attempts < 5
UNION ALL
 SELECT 'link_metadata'::text AS pipeline,
    count(*) AS pending,
    count(*) FILTER (WHERE message_links.fetch_attempts >= 2) AS stuck
   FROM zapp_history.message_links
  WHERE (message_links.fetch_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND message_links.fetch_attempts < 3
UNION ALL
 SELECT 'message_embedding'::text AS pipeline,
    count(*) AS pending,
    0 AS stuck
   FROM zapp_history.messages
  WHERE messages.embedding_status = 'pending'::text
UNION ALL
 SELECT 'summary_sync'::text AS pipeline,
    count(*) AS pending,
    0 AS stuck
   FROM zapp_history.conversation_daily_summaries
  WHERE conversation_daily_summaries.synced_to_interactions = false;
```

## zapp_history.v_priority_matrix (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
WITH quadrants AS (
         SELECT 'Q1_FAZER_AGORA'::text AS q,
            1 AS ord,
            '🔥 Fazer agora'::text AS label
        UNION ALL
         SELECT 'Q2_AGENDAR'::text,
            2,
            '📅 Agendar'::text
        UNION ALL
         SELECT 'Q3_DELEGAR'::text,
            3,
            '⚡ Delegar'::text
        UNION ALL
         SELECT 'Q4_AUTOMACAO'::text,
            4,
            '🤖 Automatizar'::text
        )
 SELECT q.q AS quadrante,
    q.ord,
    q.label,
    count(m.id) AS total,
    count(DISTINCT m.contact_id) AS contatos,
    avg(m.lead_score)::numeric(5,2) AS score_medio
   FROM quadrants q
     LEFT JOIN zapp_history.messages m ON m.priority_quadrant = q.q
  GROUP BY q.q, q.ord, q.label
  ORDER BY q.ord;
```

## zapp_history.v_proximas_respostas (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.contacts, zapp_history.conversations, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id AS message_id,
    m.created_at AS recebido_em,
    m.suggested_response_at AS responder_ate,
    m.suggested_response_label AS prazo_label,
    EXTRACT(epoch FROM m.suggested_response_at - now()) / 60::numeric AS minutos_restantes,
    ct.full_name AS contato,
    conv.remote_jid AS whatsapp,
    m.lead_score,
    m.priority_quadrant,
    m.nlp_sentiment AS sentimento,
    m.churn_risk ->> 'risk'::text AS churn,
    "left"(m.content, 150) AS preview,
        CASE
            WHEN m.suggested_response_at < now() THEN '🚨 ATRASADO'::text
            WHEN m.suggested_response_at < (now() + '00:15:00'::interval) THEN '⏰ EM 15 MIN'::text
            WHEN m.suggested_response_at < (now() + '01:00:00'::interval) THEN '⏳ EM 1H'::text
            ELSE '📅 NO PRAZO'::text
        END AS status_resposta
   FROM zapp_history.messages m
     JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
     JOIN contacts ct ON ct.id = m.contact_id
  WHERE m.suggested_response_at IS NOT NULL AND m.direction = 'inbound'::text AND conv.unread_count > 0
  ORDER BY m.suggested_response_at;
```

## zapp_history.v_question_topics (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT jsonb_array_elements_text(question_analysis -> 'topics'::text) AS topico_pergunta,
    question_analysis ->> 'type'::text AS tipo_pergunta,
    count(*) AS total_perguntas,
    count(DISTINCT contact_id) AS contatos_distintos,
    avg(lead_score)::numeric(5,2) AS score_medio
   FROM zapp_history.messages
  WHERE question_analysis IS NOT NULL
  GROUP BY (jsonb_array_elements_text(question_analysis -> 'topics'::text)), (question_analysis ->> 'type'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_recent_summaries (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.conversation_daily_summaries |
| populada | n/a |
| comentário |  |


```sql
SELECT s.id,
    s.contact_id,
    c.full_name AS contact_name,
    co.nome_crm AS company_name,
    s.summary_date,
    s.message_count,
    s.audio_count,
    s.media_count,
    s.summary_short,
    s.sentiment_overall,
    s.sentiment_score,
    s.conversion_signal,
    s.customer_mood,
    s.synced_to_interactions,
    s.generated_by_model,
    s.generation_cost_cents,
    s.created_at
   FROM zapp_history.conversation_daily_summaries s
     JOIN contacts c ON c.id = s.contact_id
     LEFT JOIN companies co ON co.id = s.company_id
  WHERE s.summary_date >= (CURRENT_DATE - 7)
  ORDER BY s.summary_date DESC, s.message_count DESC;
```

## zapp_history.v_referral_sources (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT referral_source ->> 'source'::text AS fonte,
    count(*) AS total,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS fechou
   FROM zapp_history.messages
  WHERE referral_source IS NOT NULL
  GROUP BY (referral_source ->> 'source'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_relationship_funnel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT relationship_status ->> 'status'::text AS status,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    avg((relationship_status ->> 'total_msgs'::text)::integer)::integer AS msgs_medias_por_contato,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS fechamentos
   FROM zapp_history.messages
  WHERE relationship_status IS NOT NULL
  GROUP BY (relationship_status ->> 'status'::text)
  ORDER BY (
        CASE relationship_status ->> 'status'::text
            WHEN 'recorrente_alto'::text THEN 1
            WHEN 'recorrente'::text THEN 2
            WHEN 'em_desenvolvimento'::text THEN 3
            WHEN 'iniciante'::text THEN 4
            WHEN 'novo'::text THEN 5
            WHEN 'retornante'::text THEN 6
            ELSE 7
        END);
```

## zapp_history.v_routing_queue (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id AS message_id,
    m.created_at,
    ct.full_name AS contato,
    comp.razao_social AS empresa,
    m.lead_score,
    m.bant_score ->> 'classification'::text AS bant,
    m.priority_quadrant,
    zapp_history.smart_routing(m.id) ->> 'queue'::text AS fila,
    (zapp_history.smart_routing(m.id) ->> 'priority'::text)::integer AS prioridade,
    zapp_history.smart_routing(m.id) -> 'skills_required'::text AS skills,
    zapp_history.smart_routing(m.id) ->> 'reason'::text AS razao,
    (zapp_history.smart_routing(m.id) ->> 'sla_minutes'::text)::integer AS sla_minutos,
    "left"(m.content, 150) AS preview
   FROM zapp_history.messages m
     JOIN contacts ct ON ct.id = m.contact_id
     LEFT JOIN companies comp ON comp.id = m.company_id
  WHERE m.direction = 'inbound'::text AND m.nlp_processed_at IS NOT NULL AND NOT COALESCE(m.quarantined, false) AND m.created_at > (now() - '48:00:00'::interval)
  ORDER BY ((zapp_history.smart_routing(m.id) ->> 'priority'::text)::integer), m.created_at DESC;
```

## zapp_history.v_runtime_config_safe (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.runtime_config |
| populada | n/a |
| comentário |  |


```sql
SELECT key,
        CASE
            WHEN is_secret THEN
            CASE
                WHEN value = 'PENDING_MANUAL_INSERT'::text THEN '⚠️ NOT_SET'::text
                WHEN length(value) > 12 THEN (SUBSTRING(value FROM 1 FOR 6) || '...'::text) || SUBSTRING(value FROM length(value) - 4)
                ELSE '***'::text
            END
            ELSE value
        END AS value_safe,
    is_secret,
    description,
    updated_at
   FROM zapp_history.runtime_config;
```

## zapp_history.v_seasonality_demand (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT unnest(seasonality) AS sazonalidade,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    sum((nlp_structured_order ->> 'quantity'::text)::integer) AS qty_total,
    sum(budget_detected)::numeric(14,2) AS valor_total
   FROM zapp_history.messages
  WHERE seasonality IS NOT NULL
  GROUP BY (unnest(seasonality))
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_segmentacao_clientes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT COALESCE(customer_type, 'indefinido'::text) AS tipo_cliente,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    avg((nlp_structured_order ->> 'quantity'::text)::integer)::integer AS qty_media,
    avg(budget_detected)::numeric(12,2) AS budget_medio,
    sum(budget_detected)::numeric(14,2) AS budget_total,
    count(*) FILTER (WHERE nlp_sentiment = 'urgent'::text) AS urgentes,
    array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas
   FROM zapp_history.messages
  WHERE nlp_processed_at IS NOT NULL
  GROUP BY customer_type
  ORDER BY (count(*) FILTER (WHERE lead_score >= 80)) DESC, (count(*)) DESC;
```

## zapp_history.v_sla_atendimento (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.conversations |
| populada | n/a |
| comentário |  |


```sql
SELECT COALESCE(sla_status, 'sem_resposta'::text) AS sla,
    count(*) AS total_conversas,
    min(first_response_seconds) AS resposta_mais_rapida_seg,
    max(first_response_seconds) AS resposta_mais_lenta_seg,
    avg(first_response_seconds)::integer AS resposta_media_seg,
    avg(first_response_seconds::numeric / 60.0)::numeric(6,2) AS resposta_media_min,
    count(*) FILTER (WHERE first_response_seconds <= 300) AS sla_5min,
    count(*) FILTER (WHERE first_response_seconds >= 301 AND first_response_seconds <= 1800) AS sla_30min,
    count(*) FILTER (WHERE first_response_seconds >= 1801 AND first_response_seconds <= 3600) AS sla_1h,
    count(*) FILTER (WHERE first_response_seconds > 3600) AS sla_acima_1h
   FROM zapp_history.conversations
  GROUP BY sla_status
  ORDER BY (
        CASE COALESCE(sla_status, 'sem_resposta'::text)
            WHEN '🟢 EXCELENTE (≤5min)'::text THEN 1
            WHEN '🟡 BOM (≤30min)'::text THEN 2
            WHEN '🟠 ACEITAVEL (≤1h)'::text THEN 3
            WHEN '🔴 LENTO (≤4h)'::text THEN 4
            WHEN '⛔ CRITICO (>4h)'::text THEN 5
            ELSE 6
        END);
```

## zapp_history.v_spam_log (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.conversations, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT m.id,
    m.created_at,
    m.content AS mensagem,
    c.remote_jid AS whatsapp,
    m.credibility ->> 'level'::text AS nivel,
    (m.credibility ->> 'score'::text)::integer AS score,
    m.credibility -> 'flags'::text AS flags,
    m.quarantined,
    m.quarantine_reason
   FROM zapp_history.messages m
     JOIN zapp_history.conversations c ON c.id = m.conversation_id
  WHERE (m.credibility ->> 'level'::text) = ANY (ARRAY['baixa'::text, 'critica_spam'::text])
  ORDER BY m.created_at DESC;
```

## zapp_history.v_speaker_roles (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT speaker_role AS papel,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    avg(budget_detected)::numeric(12,2) AS ticket_medio,
    count(*) FILTER (WHERE funnel_stage = 'fechamento'::text) AS fechou
   FROM zapp_history.messages
  WHERE speaker_role IS NOT NULL
  GROUP BY speaker_role
  ORDER BY (count(*) FILTER (WHERE lead_score >= 80)) DESC, (count(*)) DESC;
```

## zapp_history.v_tom_comunicacao (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT communication_tone ->> 'tone'::text AS tom,
    count(*) AS total_mensagens,
    count(DISTINCT contact_id) AS contatos_unicos,
    avg(lead_score)::numeric(5,2) AS score_medio,
    avg((communication_tone ->> 'emoji_count'::text)::integer)::numeric(5,2) AS emojis_medios,
    avg((communication_tone ->> 'word_count'::text)::integer)::numeric(5,1) AS palavras_medias,
    count(*) FILTER (WHERE (communication_tone ->> 'is_screaming'::text)::boolean) AS gritando_caps
   FROM zapp_history.messages
  WHERE communication_tone IS NOT NULL AND (communication_tone ->> 'tone'::text) <> 'indefinido'::text
  GROUP BY (communication_tone ->> 'tone'::text)
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_top_contatos_potencial (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.companies, public.contacts, zapp_history.conversations, zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT ct.id AS contact_id,
    ct.full_name AS contato,
    comp.razao_social AS empresa,
    count(DISTINCT m.id) AS total_mensagens,
    count(DISTINCT conv.id) AS total_conversas,
    max(m.lead_score) AS melhor_lead_score,
    avg(m.lead_score)::numeric(5,2) AS score_medio,
    sum(m.budget_detected)::numeric(14,2) AS budget_total_mencionado,
    avg(m.budget_detected)::numeric(12,2) AS ticket_medio_potencial,
    count(*) FILTER (WHERE m.nlp_sentiment = 'urgent'::text) AS msgs_urgentes,
    array_agg(DISTINCT m.nlp_structured_order ->> 'product'::text) FILTER (WHERE (m.nlp_structured_order ->> 'product'::text) IS NOT NULL) AS produtos_interesse,
    array_agg(DISTINCT m.discovery_channel) FILTER (WHERE m.discovery_channel IS NOT NULL) AS canais,
    array_agg(DISTINCT m.funnel_stage) FILTER (WHERE m.funnel_stage IS NOT NULL) AS etapas_passadas,
    min(m.created_at) AS primeiro_contato,
    max(m.created_at) AS ultimo_contato
   FROM zapp_history.messages m
     JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
     JOIN contacts ct ON ct.id = m.contact_id
     LEFT JOIN companies comp ON comp.id = m.company_id
  WHERE m.nlp_processed_at IS NOT NULL
  GROUP BY ct.id, ct.full_name, comp.razao_social
 HAVING max(m.lead_score) IS NOT NULL
  ORDER BY (max(m.lead_score)) DESC NULLS LAST, (sum(m.budget_detected)) DESC NULLS LAST;
```

## zapp_history.v_top_produtos_demanda (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages, zapp_history.product_dictionary |
| populada | n/a |
| comentário |  |


```sql
WITH normalized AS (
         SELECT m.id,
            m.conversation_id,
            m.contact_id,
            m.company_id,
            m.whatsapp_message_id,
            m.evolution_message_id,
            m.direction,
            m.sent_by_user_id,
            m.from_me,
            m.message_type,
            m.content,
            m.quoted_message_id,
            m.has_media,
            m.has_audio,
            m.has_links,
            m.link_count,
            m.word_count,
            m.language,
            m.message_intent,
            m.sentiment_score,
            m.embedding_status,
            m.delivery_status,
            m.delivered_at,
            m.read_at,
            m.failed_reason,
            m.raw_payload,
            m.created_at,
            m.updated_at,
            m.nlp_entities,
            m.nlp_sentiment,
            m.nlp_sentiment_score,
            m.nlp_structured_order,
            m.nlp_processed_at,
            m.nlp_request_id,
            m.lead_score,
            m.lead_score_breakdown,
            m.discovery_channel,
            m.budget_detected,
            zapp_history.normalize_product_name(m.nlp_structured_order ->> 'product'::text) AS produto_canonico
           FROM zapp_history.messages m
          WHERE m.nlp_structured_order ? 'product'::text
        )
 SELECT n.produto_canonico AS produto,
    pd.category AS categoria,
    count(*) AS total_pedidos,
    count(DISTINCT n.contact_id) AS clientes_unicos,
    sum((n.nlp_structured_order ->> 'quantity'::text)::integer) AS volume_total,
    avg((n.nlp_structured_order ->> 'quantity'::text)::integer)::integer AS quantidade_media,
    avg(n.lead_score)::numeric(5,2) AS lead_score_medio,
    count(*) FILTER (WHERE n.lead_score >= 80) AS leads_hot,
    count(*) FILTER (WHERE n.nlp_sentiment = 'urgent'::text) AS pedidos_urgentes,
    avg(n.budget_detected)::numeric(12,2) AS ticket_medio_detectado,
    min(n.created_at) AS primeiro_pedido,
    max(n.created_at) AS ultimo_pedido
   FROM normalized n
     LEFT JOIN zapp_history.product_dictionary pd ON pd.canonical_name = n.produto_canonico
  GROUP BY n.produto_canonico, pd.category
  ORDER BY (count(*)) DESC, (sum((n.nlp_structured_order ->> 'quantity'::text)::integer)) DESC NULLS LAST;
```

## zapp_history.v_topicos_recorrentes (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT unnest(topics) AS topico,
    count(*) AS total_ocorrencias,
    count(DISTINCT contact_id) AS contatos_distintos,
    avg(lead_score)::numeric(5,2) AS lead_score_medio,
    array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas_observadas
   FROM zapp_history.messages
  WHERE topics IS NOT NULL AND array_length(topics, 1) > 0
  GROUP BY (unnest(topics))
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_units_distribution (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT unit_of_measure AS unidade,
    count(*) AS total,
    avg((nlp_structured_order ->> 'quantity'::text)::integer)::integer AS qty_media
   FROM zapp_history.messages
  WHERE unit_of_measure IS NOT NULL
  GROUP BY unit_of_measure
  ORDER BY (count(*)) DESC;
```

## zapp_history.v_volume_por_hora (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | zapp_history.messages |
| populada | n/a |
| comentário |  |


```sql
SELECT day_of_week AS dia_semana,
    EXTRACT(hour FROM (created_at AT TIME ZONE 'America/Sao_Paulo'::text))::integer AS hora,
    count(*) AS total_mensagens,
    count(*) FILTER (WHERE direction = 'inbound'::text) AS inbound,
    count(*) FILTER (WHERE direction = 'outbound'::text) AS outbound,
    count(*) FILTER (WHERE in_business_hours = true) AS comercial,
    count(*) FILTER (WHERE in_business_hours = false) AS fora_expediente,
    count(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
    avg(lead_score)::numeric(5,2) AS lead_score_medio
   FROM zapp_history.messages
  WHERE day_of_week IS NOT NULL
  GROUP BY day_of_week, (EXTRACT(hour FROM (created_at AT TIME ZONE 'America/Sao_Paulo'::text)))
  ORDER BY (
        CASE day_of_week
            WHEN 'segunda'::text THEN 1
            WHEN 'terca'::text THEN 2
            WHEN 'quarta'::text THEN 3
            WHEN 'quinta'::text THEN 4
            WHEN 'sexta'::text THEN 5
            WHEN 'sabado'::text THEN 6
            WHEN 'domingo'::text THEN 7
            ELSE NULL::integer
        END), (EXTRACT(hour FROM (created_at AT TIME ZONE 'America/Sao_Paulo'::text))::integer);
```
