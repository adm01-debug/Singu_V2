-- ============================================================================
-- TABLES (sem FKs — ver 04_foreign_keys.sql)
-- Gerado por scripts/migration/extract-ddl.sh em 2026-07-21T16:10:59Z
-- Fonte: aws-1-us-east-2.pooler.supabase.com/postgres
-- ============================================================================

-- ─── public.abm_account_plans ───
CREATE TABLE public.abm_account_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  CONSTRAINT abm_account_plans_pkey PRIMARY KEY (id),
  CONSTRAINT abm_account_plans_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text]))),
  CONSTRAINT abm_account_plans_template_type_check CHECK ((template_type = ANY (ARRAY['strategic'::text, 'growth'::text, 'retention'::text, 'penetration'::text]))),
  target_revenue numeric,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  template_type text DEFAULT 'strategic'::text NOT NULL,
  goal text,
  objectives jsonb DEFAULT '[]'::jsonb NOT NULL,
  strategies jsonb DEFAULT '[]'::jsonb NOT NULL,
  key_stakeholders jsonb DEFAULT '[]'::jsonb NOT NULL,
  milestones jsonb DEFAULT '[]'::jsonb NOT NULL
);

-- ─── public.abm_accounts ───
CREATE TABLE public.abm_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  assigned_to uuid,
  CONSTRAINT abm_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT abm_accounts_user_id_external_company_id_key UNIQUE (user_id, external_company_id),
  CONSTRAINT abm_accounts_account_score_check CHECK (((account_score >= 0) AND (account_score <= 100))),
  CONSTRAINT abm_accounts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'nurture'::text, 'closed_won'::text, 'closed_lost'::text, 'paused'::text]))),
  CONSTRAINT abm_accounts_tier_check CHECK ((tier = ANY (ARRAY['strategic'::text, 'enterprise'::text, 'mid'::text, 'smb'::text]))),
  target_revenue numeric,
  notes text,
  last_scored_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  external_company_id text NOT NULL,
  company_name text NOT NULL,
  parent_account_id uuid,
  tier text DEFAULT 'mid'::text NOT NULL,
  account_score integer DEFAULT 0 NOT NULL,
  score_breakdown jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'active'::text NOT NULL
);

-- ─── public.abm_buying_committee ───
CREATE TABLE public.abm_buying_committee (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  engagement_score integer DEFAULT 0 NOT NULL,
  CONSTRAINT abm_buying_committee_pkey PRIMARY KEY (id),
  CONSTRAINT abm_buying_committee_committee_role_check CHECK ((committee_role = ANY (ARRAY['decision_maker'::text, 'influencer'::text, 'champion'::text, 'blocker'::text, 'user'::text, 'technical'::text, 'economic'::text]))),
  CONSTRAINT abm_buying_committee_engagement_score_check CHECK (((engagement_score >= 0) AND (engagement_score <= 100))),
  CONSTRAINT abm_buying_committee_influence_level_check CHECK (((influence_level >= 1) AND (influence_level <= 10))),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  external_contact_id text,
  contact_name text NOT NULL,
  contact_email text,
  contact_role text,
  committee_role text NOT NULL,
  influence_level integer DEFAULT 5 NOT NULL
);

-- ─── public.abm_campaigns ───
CREATE TABLE public.abm_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  end_date date,
  CONSTRAINT abm_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT abm_campaigns_campaign_type_check CHECK ((campaign_type = ANY (ARRAY['one_to_one'::text, 'one_to_few'::text, 'one_to_many'::text]))),
  CONSTRAINT abm_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'archived'::text]))),
  budget numeric,
  metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL,
  target_account_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
  channels text[] DEFAULT ARRAY[]::text[] NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  start_date date
);

-- ─── public.abm_whitespace_opportunities ───
CREATE TABLE public.abm_whitespace_opportunities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  identified_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT abm_whitespace_opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT abm_whitespace_opportunities_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100))),
  CONSTRAINT abm_whitespace_opportunities_opportunity_type_check CHECK ((opportunity_type = ANY (ARRAY['cross_sell'::text, 'up_sell'::text, 'expansion'::text, 'renewal'::text]))),
  CONSTRAINT abm_whitespace_opportunities_status_check CHECK ((status = ANY (ARRAY['identified'::text, 'pursuing'::text, 'won'::text, 'lost'::text, 'dismissed'::text]))),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  opportunity_type text NOT NULL,
  product_category text NOT NULL,
  estimated_value numeric,
  confidence integer DEFAULT 50 NOT NULL,
  rationale text,
  status text DEFAULT 'identified'::text NOT NULL
);

-- ─── public.access_blocked_log ───
CREATE TABLE public.access_blocked_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT access_blocked_log_pkey PRIMARY KEY (id),
  user_id uuid,
  ip_address text,
  country_code text,
  city text,
  reason text NOT NULL,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.access_security_settings ───
CREATE TABLE public.access_security_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT access_security_settings_pkey PRIMARY KEY (id),
  CONSTRAINT access_security_settings_user_id_key UNIQUE (user_id),
  user_id uuid NOT NULL,
  enable_ip_restriction boolean DEFAULT false,
  enable_geo_blocking boolean DEFAULT false,
  enable_device_detection boolean DEFAULT true,
  notify_new_device boolean DEFAULT true,
  max_sessions integer DEFAULT 5,
  session_timeout_minutes integer DEFAULT 480,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.activities ───
CREATE TABLE public.activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_entity_type_check CHECK ((entity_type = ANY (ARRAY['company'::text, 'contact'::text, 'interaction'::text, 'insight'::text, 'alert'::text]))),
  CONSTRAINT activities_type_check CHECK ((type = ANY (ARRAY['company_created'::text, 'contact_created'::text, 'interaction_added'::text, 'insight_generated'::text, 'tag_added'::text, 'profile_updated'::text, 'alert_triggered'::text]))),
  user_id uuid NOT NULL,
  type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.ai_chat_messages ───
CREATE TABLE public.ai_chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))),
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  tokens_used integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.ai_chat_threads ───
CREATE TABLE public.ai_chat_threads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ai_chat_threads_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  title text DEFAULT 'Nova conversa'::text NOT NULL,
  context_entity_type text,
  context_entity_id uuid,
  pinned boolean DEFAULT false NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  last_message_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.ai_recommendation_audit_logs ───
CREATE TABLE public.ai_recommendation_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT ai_recommendation_audit_logs_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  score double precision NOT NULL,
  recommendation_type text NOT NULL,
  reasons text[] DEFAULT '{}'::text[] NOT NULL,
  data_used jsonb DEFAULT '{}'::jsonb,
  user_action text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.ai_recommendation_audit_logs_v2 ───
CREATE TABLE public.ai_recommendation_audit_logs_v2 (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT ai_recommendation_audit_logs_v2_pkey PRIMARY KEY (id),
  contact_id text,
  user_id uuid NOT NULL,
  score integer,
  recommendation_type text NOT NULL,
  reasons text[],
  data_used jsonb DEFAULT '{}'::jsonb,
  user_action text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.ai_recommendation_logs ───
CREATE TABLE public.ai_recommendation_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT ai_recommendation_logs_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  recommendation_score double precision NOT NULL,
  recommendation_reasons jsonb NOT NULL,
  input_data_snapshot jsonb NOT NULL,
  user_action text,
  action_timestamp timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.ai_tone_preferences ───
CREATE TABLE public.ai_tone_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT ai_tone_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT ai_tone_preferences_user_id_company_id_key UNIQUE (user_id, company_id),
  user_id uuid NOT NULL,
  company_id uuid,
  preferred_tone text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.alerts ───
CREATE TABLE public.alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  expires_at timestamp with time zone,
  CONSTRAINT alerts_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT alerts_type_check CHECK ((type = ANY (ARRAY['birthday'::text, 'no_contact'::text, 'sentiment_drop'::text, 'opportunity'::text, 'follow_up'::text, 'life_event'::text]))),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  type text NOT NULL,
  priority text DEFAULT 'medium'::text,
  title text NOT NULL,
  description text,
  action_url text,
  dismissed boolean DEFAULT false
);

-- ─── public.applied_objection_responses ───
CREATE TABLE public.applied_objection_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT applied_objection_responses_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  objection text NOT NULL,
  category text,
  response_text text,
  interaction_id uuid,
  note text,
  applied_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.attribution_models_cache ───
CREATE TABLE public.attribution_models_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT attribution_models_cache_pkey PRIMARY KEY (id),
  CONSTRAINT attribution_models_cache_user_id_deal_id_model_key UNIQUE (user_id, deal_id, model),
  CONSTRAINT attribution_models_cache_model_check CHECK ((model = ANY (ARRAY['first'::text, 'last'::text, 'linear'::text, 'u_shape'::text, 'w_shape'::text, 'time_decay'::text]))),
  user_id uuid NOT NULL,
  deal_id text NOT NULL,
  model text NOT NULL,
  allocations jsonb DEFAULT '[]'::jsonb NOT NULL,
  total_value numeric DEFAULT 0 NOT NULL,
  computed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.attribution_touchpoints ───
CREATE TABLE public.attribution_touchpoints (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  term text,
  CONSTRAINT attribution_touchpoints_pkey PRIMARY KEY (id),
  CONSTRAINT attribution_touchpoints_touchpoint_type_check CHECK ((touchpoint_type = ANY (ARRAY['form'::text, 'email'::text, 'page_view'::text, 'magnet'::text, 'sequence'::text, 'call'::text, 'meeting'::text, 'ad'::text, 'social'::text, 'referral'::text, 'other'::text]))),
  page_url text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL,
  value_attributed numeric DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  deal_id text,
  touchpoint_type text NOT NULL,
  source text,
  medium text,
  campaign text,
  content text
);

-- ─── public.automation_logs ───
CREATE TABLE public.automation_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT automation_logs_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  trigger_entity_type text NOT NULL,
  trigger_entity_id uuid NOT NULL,
  actions_executed jsonb DEFAULT '[]'::jsonb NOT NULL,
  success boolean DEFAULT true NOT NULL,
  error_message text,
  executed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.automation_rules ───
CREATE TABLE public.automation_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  execution_count integer DEFAULT 0 NOT NULL,
  CONSTRAINT automation_rules_pkey PRIMARY KEY (id),
  last_executed_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb DEFAULT '{}'::jsonb NOT NULL,
  conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
  actions jsonb DEFAULT '[]'::jsonb NOT NULL
);

-- ─── public.battle_cards ───
CREATE TABLE public.battle_cards (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  win_themes text[] DEFAULT ARRAY[]::text[] NOT NULL,
  CONSTRAINT battle_cards_pkey PRIMARY KEY (id),
  landmines text[] DEFAULT ARRAY[]::text[] NOT NULL,
  proof_points jsonb DEFAULT '[]'::jsonb NOT NULL,
  last_updated_by uuid,
  version integer DEFAULT 1 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  competitor_name text NOT NULL,
  competitor_logo_url text,
  summary text,
  our_strengths jsonb DEFAULT '[]'::jsonb NOT NULL,
  their_strengths jsonb DEFAULT '[]'::jsonb NOT NULL,
  weaknesses jsonb DEFAULT '[]'::jsonb NOT NULL,
  pricing_comparison text
);

-- ─── public.behavioral_insight_feedback ───
CREATE TABLE public.behavioral_insight_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT behavioral_insight_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT behavioral_insight_feedback_unique UNIQUE (user_id, contact_id, insight_kind, insight_label),
  CONSTRAINT behavioral_insight_feedback_insight_kind_check CHECK ((insight_kind = ANY (ARRAY['preference'::text, 'hobby'::text, 'tone'::text]))),
  CONSTRAINT behavioral_insight_feedback_insight_label_check CHECK (((char_length(insight_label) >= 1) AND (char_length(insight_label) <= 200))),
  CONSTRAINT behavioral_insight_feedback_note_check CHECK (((note IS NULL) OR (char_length(note) <= 1000))),
  CONSTRAINT behavioral_insight_feedback_vote_check CHECK ((vote = ANY (ARRAY['-1'::integer, 1]))),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  insight_kind text NOT NULL,
  insight_label text NOT NULL,
  vote smallint NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.behavioral_profile_regen_queue ───
CREATE TABLE public.behavioral_profile_regen_queue (
  contact_id uuid NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT behavioral_profile_regen_queue_pkey PRIMARY KEY (contact_id),
  user_id uuid NOT NULL,
  enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
  next_run_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  last_processed_at timestamp with time zone,
  trigger_source text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.brain_dominance_analysis ───
CREATE TABLE public.brain_dominance_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brain_dominance_analysis_pkey PRIMARY KEY (id),
  updated_at timestamp with time zone DEFAULT now(),
  contact_id uuid,
  reptilian_score integer DEFAULT 0,
  limbic_score integer DEFAULT 0,
  neocortex_score integer DEFAULT 0,
  dominant_system text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  negotiation_tips jsonb DEFAULT '[]'::jsonb,
  analyzed_at timestamp with time zone DEFAULT now()
);

-- ─── public.call_logs ───
CREATE TABLE public.call_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sentiment text,
  CONSTRAINT call_logs_pkey PRIMARY KEY (id),
  CONSTRAINT call_logs_external_id_key UNIQUE (external_id),
  CONSTRAINT call_logs_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
  CONSTRAINT call_logs_status_check CHECK ((status = ANY (ARRAY['completed'::text, 'missed'::text, 'busy'::text, 'failed'::text, 'no-answer'::text]))),
  summary text,
  external_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  direction text,
  status text,
  duration_seconds integer DEFAULT 0,
  audio_url text,
  transcription text
);

-- ─── public.campaign_recipients ───
CREATE TABLE public.campaign_recipients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT campaign_recipients_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_recipients_campaign_id_contact_id_key UNIQUE (campaign_id, contact_id),
  CONSTRAINT campaign_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'unsubscribed'::text]))),
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.canned_responses ───
CREATE TABLE public.canned_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT canned_responses_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral'::text,
  shortcut text,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.churn_risk_scores ───
CREATE TABLE public.churn_risk_scores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  score_trend text,
  CONSTRAINT churn_risk_scores_pkey PRIMARY KEY (id),
  CONSTRAINT churn_risk_scores_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  CONSTRAINT churn_risk_scores_risk_score_check CHECK (((risk_score >= 0) AND (risk_score <= 100))),
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  risk_level text DEFAULT 'low'::text NOT NULL,
  risk_score integer DEFAULT 0 NOT NULL,
  risk_factors jsonb DEFAULT '[]'::jsonb NOT NULL,
  recommendations text[] DEFAULT '{}'::text[],
  days_since_last_interaction integer,
  sentiment_trend text
);

-- ─── public.city_whitelist ───
CREATE TABLE public.city_whitelist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT city_whitelist_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  city text NOT NULL,
  state text,
  country_code text DEFAULT 'BR'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.client_values ───
CREATE TABLE public.client_values (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT client_values_pkey PRIMARY KEY (id),
  CONSTRAINT client_values_user_id_contact_id_category_value_name_key UNIQUE (user_id, contact_id, category, value_name),
  CONSTRAINT client_values_importance_check CHECK (((importance >= 1) AND (importance <= 10))),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  category text NOT NULL,
  value_name text NOT NULL,
  importance integer DEFAULT 5,
  detected_phrases text[],
  frequency integer DEFAULT 1,
  last_mentioned timestamp with time zone DEFAULT now()
);

-- ─── public.coaching_scorecards ───
CREATE TABLE public.coaching_scorecards (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT coaching_scorecards_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  criteria jsonb DEFAULT '[]'::jsonb NOT NULL,
  active boolean DEFAULT true NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.cognitive_bias_history ───
CREATE TABLE public.cognitive_bias_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sales_strategies jsonb,
  CONSTRAINT cognitive_bias_history_pkey PRIMARY KEY (id),
  profile_summary text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  detected_biases jsonb NOT NULL,
  category_distribution jsonb,
  dominant_biases text[],
  vulnerabilities text[],
  resistances text[]
);

-- ─── public.communication_preferences ───
CREATE TABLE public.communication_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  notes text,
  CONSTRAINT communication_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT communication_preferences_user_id_contact_id_key UNIQUE (user_id, contact_id),
  response_rate_by_channel jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  preferred_channel text DEFAULT 'whatsapp'::text NOT NULL,
  preferred_days text[] DEFAULT '{}'::text[],
  preferred_time_start time without time zone,
  preferred_time_end time without time zone,
  contact_frequency text DEFAULT 'weekly'::text,
  avoid_days text[] DEFAULT '{}'::text[]
);

-- ─── public.companies ───
CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  state text,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_financial_health_check CHECK ((financial_health = ANY (ARRAY['growing'::text, 'stable'::text, 'cutting'::text, 'unknown'::text]))),
  logo_url text,
  notes text,
  tags text[] DEFAULT '{}'::text[],
  financial_health text DEFAULT 'unknown'::text,
  employee_count text,
  annual_revenue text,
  competitors text[] DEFAULT '{}'::text[],
  challenges text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  cnpj text,
  cnpj_base text,
  razao_social text,
  nome_fantasia text,
  nome_crm text,
  nicho_cliente text,
  ramo_atividade text,
  capital_social numeric,
  status text DEFAULT 'ativo'::text,
  name text NOT NULL,
  situacao_rf text,
  situacao_rf_data date,
  porte_rf text,
  natureza_juridica text,
  natureza_juridica_desc text,
  data_fundacao date,
  grupo_economico text,
  grupo_economico_id uuid,
  is_customer boolean DEFAULT false,
  is_supplier boolean DEFAULT false,
  industry text,
  is_carrier boolean DEFAULT false,
  is_matriz boolean,
  matriz_id uuid,
  tipo_cooperativa text,
  numero_cooperativa text,
  singular_id uuid,
  central_id uuid,
  confederacao_id uuid,
  inscricao_estadual text,
  inscricao_municipal text,
  website text,
  cores_marca text,
  extra_data_rf jsonb,
  bitrix_company_id integer,
  search_vector tsvector,
  lat double precision,
  lng double precision,
  instagram text,
  linkedin text,
  facebook text,
  youtube text,
  phone text,
  twitter text,
  tiktok text,
  version integer DEFAULT 0 NOT NULL,
  external_id text,
  vak_dominant text,
  motivation_direction text,
  working_style text,
  strategic_roadmap jsonb DEFAULT '[]'::jsonb,
  email text,
  address text,
  city text
);

-- ─── public.compatibility_alerts ───
CREATE TABLE public.compatibility_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT compatibility_alerts_pkey PRIMARY KEY (id),
  expires_at timestamp with time zone,
  user_id uuid NOT NULL,
  contact_id uuid,
  compatibility_score integer NOT NULL,
  threshold integer NOT NULL,
  alert_type text DEFAULT 'below_threshold'::text NOT NULL,
  title text NOT NULL,
  description text,
  dismissed boolean DEFAULT false
);

-- ─── public.compatibility_settings ───
CREATE TABLE public.compatibility_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT compatibility_settings_pkey PRIMARY KEY (id),
  CONSTRAINT compatibility_settings_user_id_key UNIQUE (user_id),
  user_id uuid NOT NULL,
  alert_threshold integer DEFAULT 50 NOT NULL,
  alert_only_important boolean DEFAULT true,
  important_min_relationship_score integer DEFAULT 70,
  email_notifications boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.competitors ───
CREATE TABLE public.competitors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  active boolean DEFAULT true NOT NULL,
  CONSTRAINT competitors_pkey PRIMARY KEY (id),
  CONSTRAINT competitors_user_id_name_key UNIQUE (user_id, name),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  website text,
  strengths text[] DEFAULT ARRAY[]::text[],
  weaknesses text[] DEFAULT ARRAY[]::text[],
  typical_price_range text,
  win_rate_against numeric(5,2) DEFAULT 0,
  notes text
);

-- ─── public.connection_anomalies ───
CREATE TABLE public.connection_anomalies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  detected_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT connection_anomalies_pkey PRIMARY KEY (id),
  CONSTRAINT connection_anomalies_anomaly_type_check CHECK ((anomaly_type = ANY (ARRAY['error_spike'::text, 'latency_degradation'::text, 'suspicious_window'::text, 'volume_drop'::text, 'volume_spike'::text, 'schema_drift'::text]))),
  CONSTRAINT connection_anomalies_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))),
  CONSTRAINT connection_anomalies_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  model_used text,
  confidence numeric(4,3),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  webhook_id uuid,
  connection_id uuid,
  anomaly_type text NOT NULL,
  severity text DEFAULT 'medium'::text NOT NULL,
  explanation text NOT NULL,
  metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
  window_start timestamp with time zone NOT NULL,
  window_end timestamp with time zone NOT NULL
);

-- ─── public.connection_configs ───
CREATE TABLE public.connection_configs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  last_test_latency_ms integer,
  CONSTRAINT connection_configs_pkey PRIMARY KEY (id),
  CONSTRAINT connection_configs_connection_type_check CHECK ((connection_type = ANY (ARRAY['supabase_external'::text, 'bitrix24'::text, 'n8n'::text, 'mcp_claude'::text, 'custom'::text]))),
  last_test_message text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  encrypted_config bytea,
  encryption_version smallint DEFAULT 1 NOT NULL,
  discovered_schema jsonb,
  discovered_at timestamp with time zone,
  name text NOT NULL,
  connection_type text NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  secret_refs jsonb DEFAULT '{}'::jsonb NOT NULL,
  last_tested_at timestamp with time zone,
  last_test_status text
);

-- ─── public.connection_quotas ───
CREATE TABLE public.connection_quotas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT connection_quotas_pkey PRIMARY KEY (id),
  CONSTRAINT connection_quotas_webhook_id_period_start_key UNIQUE (webhook_id, period_start),
  webhook_id uuid NOT NULL,
  period_start date DEFAULT (date_trunc('month'::text, now()))::date NOT NULL,
  calls_limit integer DEFAULT 10000 NOT NULL,
  calls_used integer DEFAULT 0 NOT NULL,
  overage_blocked boolean DEFAULT true NOT NULL,
  alert_sent_80 boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.connection_test_logs ───
CREATE TABLE public.connection_test_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT connection_test_logs_pkey PRIMARY KEY (id),
  connection_id uuid NOT NULL,
  status text NOT NULL,
  latency_ms integer,
  message text,
  details jsonb,
  tested_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.contact_analytical_profile_versions ───
CREATE TABLE public.contact_analytical_profile_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  hobbies jsonb DEFAULT '[]'::jsonb NOT NULL,
  CONSTRAINT contact_analytical_profile_versions_pkey PRIMARY KEY (id),
  recurrent_topics jsonb DEFAULT '[]'::jsonb NOT NULL,
  based_on_count integer DEFAULT 0 NOT NULL,
  model text,
  trigger_source text,
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  profile_id uuid,
  summary text,
  tone text,
  communication_style text,
  sentiment_trend text,
  preferences jsonb DEFAULT '[]'::jsonb NOT NULL
);

-- ─── public.contact_analytical_profiles ───
CREATE TABLE public.contact_analytical_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tone text,
  CONSTRAINT contact_analytical_profiles_pkey PRIMARY KEY (id),
  summary text,
  based_on_count integer DEFAULT 0 NOT NULL,
  model text,
  contact_id uuid,
  user_id uuid,
  preferences jsonb DEFAULT '[]'::jsonb,
  recurrent_topics jsonb DEFAULT '[]'::jsonb,
  communication_style text,
  sentiment_trend text,
  last_updated_at timestamp with time zone DEFAULT now(),
  hobbies jsonb DEFAULT '[]'::jsonb NOT NULL
);

-- ─── public.contact_automation_settings ───
CREATE TABLE public.contact_automation_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  last_escalation_at timestamp with time zone,
  CONSTRAINT contact_automation_settings_pkey PRIMARY KEY (id),
  CONSTRAINT contact_automation_settings_contact_id_key UNIQUE (contact_id),
  resolution_summary text,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  reminder_enabled boolean DEFAULT true,
  escalation_enabled boolean DEFAULT false,
  delay_hours integer DEFAULT 24,
  escalation_role text DEFAULT 'supervisor'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── public.contact_behavior ───
CREATE TABLE public.contact_behavior (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  current_pressure text,
  CONSTRAINT contact_behavior_pkey PRIMARY KEY (id),
  CONSTRAINT contact_behavior_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_behavior_decision_power_check CHECK (((decision_power >= 1) AND (decision_power <= 10))),
  CONSTRAINT contact_behavior_disc_confidence_check CHECK (((disc_confidence >= 0) AND (disc_confidence <= 100))),
  CONSTRAINT contact_behavior_disc_primary_check CHECK ((disc_primary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  CONSTRAINT contact_behavior_formality_level_check CHECK (((formality_level >= 1) AND (formality_level <= 5))),
  CONSTRAINT contact_behavior_support_level_check CHECK (((support_level >= 1) AND (support_level <= 10))),
  CONSTRAINT contact_behavior_vak_primary_check CHECK ((vak_primary = ANY (ARRAY['visual'::text, 'auditivo'::text, 'cinestesico'::text]))),
  CONSTRAINT disc_confidence_range CHECK (((disc_confidence >= 0) AND (disc_confidence <= 100))),
  CONSTRAINT formality_level_range CHECK (((formality_level >= 1) AND (formality_level <= 5))),
  professional_goals text,
  preferred_channel text,
  message_style text,
  response_time_avg interval,
  best_contact_window text,
  formality_level integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  vak_visual integer DEFAULT 0,
  contact_id uuid NOT NULL,
  vak_auditory integer DEFAULT 0,
  vak_kinesthetic integer DEFAULT 0,
  decision_speed text,
  decision_criteria text[],
  needs_approval boolean DEFAULT false,
  approver_id uuid,
  budget_authority boolean DEFAULT false,
  decision_role text,
  decision_power integer,
  support_level integer,
  disc_primary text,
  influencer_ids uuid[],
  company_financial_health text,
  current_challenges text[],
  current_competitors text[],
  best_time_to_approach text,
  seasonal_notes text,
  disc_confidence integer,
  disc_notes text,
  vak_primary text,
  motivation_primary text,
  main_fear text,
  career_stage text
);

-- ─── public.contact_business_context ───
CREATE TABLE public.contact_business_context (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_business_context_pkey PRIMARY KEY (id),
  CONSTRAINT contact_business_context_contact_id_key UNIQUE (contact_id),
  contact_id uuid NOT NULL,
  financial_health text,
  current_challenges text[],
  competitors_used text[],
  best_moment_to_approach text,
  seasonal_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.contact_cadence ───
CREATE TABLE public.contact_cadence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_cadence_pkey PRIMARY KEY (id),
  CONSTRAINT contact_cadence_user_id_contact_id_key UNIQUE (user_id, contact_id),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  cadence_days integer DEFAULT 14 NOT NULL,
  priority character varying(20) DEFAULT 'medium'::character varying,
  auto_remind boolean DEFAULT true,
  last_contact_at timestamp with time zone,
  next_contact_due timestamp with time zone,
  notes text
);

-- ─── public.contact_cadence_audit ───
CREATE TABLE public.contact_cadence_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_cadence_audit_pkey PRIMARY KEY (id),
  cadence_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.contact_decision_making ───
CREATE TABLE public.contact_decision_making (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_decision_making_pkey PRIMARY KEY (id),
  CONSTRAINT contact_decision_making_contact_id_key UNIQUE (contact_id),
  contact_id uuid NOT NULL,
  decision_speed text,
  decision_criteria text[],
  needs_approval boolean DEFAULT false,
  approver_id uuid,
  budget_authority text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.contact_family_history ───
CREATE TABLE public.contact_family_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_family_history_pkey PRIMARY KEY (id),
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  family_info text,
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.contact_influence ───
CREATE TABLE public.contact_influence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_influence_pkey PRIMARY KEY (id),
  CONSTRAINT contact_influence_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_influence_decision_power_check CHECK (((decision_power >= 1) AND (decision_power <= 10))),
  CONSTRAINT contact_influence_support_level_check CHECK (((support_level >= 1) AND (support_level <= 10))),
  CONSTRAINT decision_power_range CHECK (((decision_power >= 1) AND (decision_power <= 10))),
  CONSTRAINT support_level_range CHECK (((support_level >= 1) AND (support_level <= 10))),
  contact_id uuid NOT NULL,
  decision_role text,
  decision_power integer,
  support_level integer,
  influencer_ids uuid[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.contact_metaprograms ───
CREATE TABLE public.contact_metaprograms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reactive_score integer,
  CONSTRAINT contact_metaprograms_pkey PRIMARY KEY (id),
  CONSTRAINT contact_metaprograms_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_metaprograms_away_from_score_check CHECK (((away_from_score >= 0) AND (away_from_score <= 100))),
  CONSTRAINT contact_metaprograms_detail_score_check CHECK (((detail_score >= 0) AND (detail_score <= 100))),
  CONSTRAINT contact_metaprograms_external_score_check CHECK (((external_score >= 0) AND (external_score <= 100))),
  CONSTRAINT contact_metaprograms_global_score_check CHECK (((global_score >= 0) AND (global_score <= 100))),
  CONSTRAINT contact_metaprograms_internal_score_check CHECK (((internal_score >= 0) AND (internal_score <= 100))),
  CONSTRAINT contact_metaprograms_options_score_check CHECK (((options_score >= 0) AND (options_score <= 100))),
  CONSTRAINT contact_metaprograms_proactive_score_check CHECK (((proactive_score >= 0) AND (proactive_score <= 100))),
  CONSTRAINT contact_metaprograms_procedures_score_check CHECK (((procedures_score >= 0) AND (procedures_score <= 100))),
  CONSTRAINT contact_metaprograms_reactive_score_check CHECK (((reactive_score >= 0) AND (reactive_score <= 100))),
  CONSTRAINT contact_metaprograms_toward_score_check CHECK (((toward_score >= 0) AND (toward_score <= 100))),
  global_score integer,
  detail_score integer,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  contact_id uuid NOT NULL,
  toward_score integer,
  away_from_score integer,
  internal_score integer,
  external_score integer,
  options_score integer,
  procedures_score integer,
  proactive_score integer
);

-- ─── public.contact_next_actions ───
CREATE TABLE public.contact_next_actions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  signals_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT contact_next_actions_pkey PRIMARY KEY (id),
  CONSTRAINT contact_next_actions_user_id_contact_id_key UNIQUE (user_id, contact_id),
  CONSTRAINT contact_next_actions_urgency_check CHECK ((urgency = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  model text,
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  suggested_date timestamp with time zone,
  script_context jsonb,
  status text DEFAULT 'pending'::text,
  completed_at timestamp with time zone,
  completion_notes text,
  user_id uuid NOT NULL,
  edited_script text,
  contextual_tone text,
  completion_date timestamp with time zone,
  was_successful boolean DEFAULT true,
  contact_id uuid NOT NULL,
  action text NOT NULL,
  reason text NOT NULL,
  channel text NOT NULL,
  urgency text DEFAULT 'medium'::text NOT NULL,
  suggested_script text,
  expected_outcome text
);

-- ─── public.contact_objection_scripts ───
CREATE TABLE public.contact_objection_scripts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_objection_scripts_pkey PRIMARY KEY (id),
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  objection_type text NOT NULL,
  script_content text NOT NULL,
  neurological_bias text,
  effectiveness_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── public.contact_personality ───
CREATE TABLE public.contact_personality (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  mbti_e_i_score integer,
  CONSTRAINT contact_personality_pkey PRIMARY KEY (id),
  CONSTRAINT contact_personality_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_personality_big_five_agreeableness_check CHECK (((big_five_agreeableness >= 0) AND (big_five_agreeableness <= 100))),
  CONSTRAINT contact_personality_big_five_confidence_check CHECK (((big_five_confidence >= 0) AND (big_five_confidence <= 100))),
  CONSTRAINT contact_personality_big_five_conscientiousness_check CHECK (((big_five_conscientiousness >= 0) AND (big_five_conscientiousness <= 100))),
  CONSTRAINT contact_personality_big_five_extraversion_check CHECK (((big_five_extraversion >= 0) AND (big_five_extraversion <= 100))),
  CONSTRAINT contact_personality_big_five_neuroticism_check CHECK (((big_five_neuroticism >= 0) AND (big_five_neuroticism <= 100))),
  CONSTRAINT contact_personality_big_five_openness_check CHECK (((big_five_openness >= 0) AND (big_five_openness <= 100))),
  CONSTRAINT contact_personality_enneagram_type_check CHECK (((enneagram_type >= 1) AND (enneagram_type <= 9))),
  CONSTRAINT contact_personality_enneagram_wing_check CHECK (((enneagram_wing >= 1) AND (enneagram_wing <= 9))),
  CONSTRAINT contact_personality_mbti_e_i_score_check CHECK (((mbti_e_i_score >= 0) AND (mbti_e_i_score <= 100))),
  CONSTRAINT contact_personality_mbti_j_p_score_check CHECK (((mbti_j_p_score >= 0) AND (mbti_j_p_score <= 100))),
  CONSTRAINT contact_personality_mbti_s_n_score_check CHECK (((mbti_s_n_score >= 0) AND (mbti_s_n_score <= 100))),
  CONSTRAINT contact_personality_mbti_t_f_score_check CHECK (((mbti_t_f_score >= 0) AND (mbti_t_f_score <= 100))),
  CONSTRAINT contact_personality_mbti_type_check CHECK ((mbti_type ~ '^[E|I][S|N][T|F][J|P]$'::text)),
  mbti_s_n_score integer,
  mbti_t_f_score integer,
  mbti_j_p_score integer,
  enneagram_type integer,
  enneagram_wing integer,
  enneagram_scores jsonb,
  temperament_primary text,
  temperament_secondary text,
  temperament_notes text,
  contact_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  big_five_openness integer,
  big_five_conscientiousness integer,
  big_five_extraversion integer,
  big_five_agreeableness integer,
  big_five_neuroticism integer,
  big_five_confidence integer,
  mbti_type text
);

-- ─── public.contact_predictive_roadmap ───
CREATE TABLE public.contact_predictive_roadmap (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_predictive_roadmap_pkey PRIMARY KEY (id),
  CONSTRAINT contact_predictive_roadmap_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  forecast_month date NOT NULL,
  predicted_need text NOT NULL,
  probability integer,
  suggested_offering text,
  rationale text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.contact_preferences ───
CREATE TABLE public.contact_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  personal_notes text,
  CONSTRAINT contact_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT contact_preferences_user_id_contact_id_key UNIQUE (user_id, contact_id),
  communication_tips text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  preferred_channel character varying(50) DEFAULT 'whatsapp'::character varying,
  preferred_days text[] DEFAULT '{}'::text[],
  preferred_times text[] DEFAULT '{}'::text[],
  avoid_days text[] DEFAULT '{}'::text[],
  avoid_times text[] DEFAULT '{}'::text[],
  restrictions text
);

-- ─── public.contact_preferences_audit ───
CREATE TABLE public.contact_preferences_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_preferences_audit_pkey PRIMARY KEY (id),
  preference_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.contact_rapport_strategy ───
CREATE TABLE public.contact_rapport_strategy (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  voice_tone_preferred text,
  CONSTRAINT contact_rapport_strategy_pkey PRIMARY KEY (id),
  CONSTRAINT contact_rapport_strategy_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_rapport_strategy_auditory_preference_score_check CHECK (((auditory_preference_score >= 0) AND (auditory_preference_score <= 100))),
  CONSTRAINT contact_rapport_strategy_digital_preference_score_check CHECK (((digital_preference_score >= 0) AND (digital_preference_score <= 100))),
  CONSTRAINT contact_rapport_strategy_kinesthetic_preference_score_check CHECK (((kinesthetic_preference_score >= 0) AND (kinesthetic_preference_score <= 100))),
  CONSTRAINT contact_rapport_strategy_pacing_speed_check CHECK ((pacing_speed = ANY (ARRAY['slow'::text, 'medium'::text, 'fast'::text]))),
  CONSTRAINT contact_rapport_strategy_visual_preference_score_check CHECK (((visual_preference_score >= 0) AND (visual_preference_score <= 100))),
  mirroring_technique text,
  preferred_triggers text[],
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  contact_id uuid NOT NULL,
  visual_preference_score integer,
  auditory_preference_score integer,
  kinesthetic_preference_score integer,
  digital_preference_score integer,
  emotional_anchors text[],
  resistance_triggers text[],
  pacing_speed text
);

-- ─── public.contact_relatives ───
CREATE TABLE public.contact_relatives (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  occupation text,
  CONSTRAINT contact_relatives_pkey PRIMARY KEY (id),
  company text,
  notes text,
  is_decision_influencer boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  name text NOT NULL,
  relationship_type text NOT NULL,
  age integer,
  birthday date,
  phone text,
  email text
);

-- ─── public.contact_relatives_audit ───
CREATE TABLE public.contact_relatives_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_relatives_audit_pkey PRIMARY KEY (id),
  relative_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  change_type text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamp with time zone DEFAULT now() NOT NULL,
  reason text
);

-- ─── public.contact_report_overrides ───
CREATE TABLE public.contact_report_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_report_overrides_pkey PRIMARY KEY (id),
  CONSTRAINT contact_report_overrides_contact_id_key UNIQUE (contact_id),
  contact_id uuid NOT NULL,
  insights_data jsonb DEFAULT '{}'::jsonb,
  custom_scripts jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─── public.contact_time_analysis ───
CREATE TABLE public.contact_time_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_time_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key UNIQUE (user_id, contact_id, day_of_week, hour_of_day),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  hour_of_day integer NOT NULL,
  success_count integer DEFAULT 0,
  total_attempts integer DEFAULT 0,
  avg_response_time_minutes integer,
  last_updated timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.contact_time_analysis_audit ───
CREATE TABLE public.contact_time_analysis_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT contact_time_analysis_audit_pkey PRIMARY KEY (id),
  analysis_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.contacts ───
CREATE TABLE public.contacts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  whatsapp text,
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_relationship_score_check CHECK (((relationship_score >= 0) AND (relationship_score <= 100))),
  CONSTRAINT contacts_relationship_stage_check CHECK ((relationship_stage = ANY (ARRAY['unknown'::text, 'prospect'::text, 'qualified_lead'::text, 'opportunity'::text, 'negotiation'::text, 'customer'::text, 'loyal_customer'::text, 'advocate'::text, 'at_risk'::text, 'lost'::text]))),
  CONSTRAINT contacts_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'manager'::text, 'buyer'::text, 'contact'::text, 'decision_maker'::text, 'influencer'::text]))),
  CONSTRAINT contacts_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))),
  linkedin text,
  instagram text,
  twitter text,
  avatar_url text,
  birthday date,
  notes text,
  tags text[] DEFAULT '{}'::text[],
  hobbies text[] DEFAULT '{}'::text[],
  interests text[] DEFAULT '{}'::text[],
  user_id uuid NOT NULL,
  family_info text,
  personal_notes text,
  relationship_stage text DEFAULT 'unknown'::text,
  relationship_score integer DEFAULT 0,
  sentiment text DEFAULT 'neutral'::text,
  behavior jsonb DEFAULT '{"discProfile": null, "supportLevel": 5, "decisionPower": 5, "influencesIds": [], "needsApproval": false, "discConfidence": 0, "formalityLevel": 3, "competitorsUsed": [], "influencedByIds": [], "decisionCriteria": [], "preferredChannel": "whatsapp", "currentChallenges": []}'::jsonb,
  life_events jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  version integer DEFAULT 0 NOT NULL,
  company_id uuid,
  external_id text,
  rapport_metadata jsonb DEFAULT '{}'::jsonb,
  last_interaction_at timestamp with time zone,
  interactions_count integer DEFAULT 0,
  vak_dominant text,
  motivation_direction text,
  working_style text,
  reference_frame text,
  chunk_size text,
  action_filter text,
  first_name text NOT NULL,
  comparison_style text,
  most_frequent_objection text,
  vak_profile jsonb DEFAULT '{}'::jsonb,
  metaprogram_profile jsonb DEFAULT '{}'::jsonb,
  objection_patterns jsonb DEFAULT '[]'::jsonb,
  predictive_roadmap jsonb DEFAULT '[]'::jsonb,
  future_needs_forecast jsonb DEFAULT '[]'::jsonb,
  last_name text NOT NULL,
  role text DEFAULT 'contact'::text,
  role_title text,
  email text,
  phone text
);

-- ─── public.conversation_analyses ───
CREATE TABLE public.conversation_analyses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  questions_asked integer DEFAULT 0,
  CONSTRAINT conversation_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_analyses_user_id_interaction_id_key UNIQUE (user_id, interaction_id),
  CONSTRAINT conversation_analyses_coaching_score_check CHECK (((coaching_score >= 0) AND (coaching_score <= 100))),
  CONSTRAINT conversation_analyses_sentiment_overall_check CHECK ((sentiment_overall = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'mixed'::text]))),
  sentiment_overall text,
  sentiment_timeline jsonb DEFAULT '[]'::jsonb NOT NULL,
  topics jsonb DEFAULT '[]'::jsonb NOT NULL,
  objections jsonb DEFAULT '[]'::jsonb NOT NULL,
  action_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  key_moments jsonb DEFAULT '[]'::jsonb NOT NULL,
  coaching_score integer,
  coaching_tips text[] DEFAULT '{}'::text[] NOT NULL,
  next_best_action text,
  user_id uuid NOT NULL,
  model_used text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  interaction_id uuid NOT NULL,
  contact_id uuid,
  deal_id uuid,
  duration_seconds integer,
  talk_ratio_rep numeric(5,2),
  talk_ratio_customer numeric(5,2),
  longest_monologue_seconds integer
);

-- ─── public.conversation_topics_catalog ───
CREATE TABLE public.conversation_topics_catalog (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT conversation_topics_catalog_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_topics_catalog_user_id_topic_key_key UNIQUE (user_id, topic_key),
  CONSTRAINT conversation_topics_catalog_category_check CHECK ((category = ANY (ARRAY['product'::text, 'pricing'::text, 'competition'::text, 'objection'::text, 'closing'::text, 'discovery'::text, 'other'::text]))),
  user_id uuid NOT NULL,
  topic_key text NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  keywords text[] DEFAULT '{}'::text[] NOT NULL,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.conversational_search_cache ───
CREATE TABLE public.conversational_search_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT conversational_search_cache_pkey PRIMARY KEY (id),
  CONSTRAINT conversational_search_cache_user_id_query_hash_key UNIQUE (user_id, query_hash),
  user_id uuid NOT NULL,
  query_hash text NOT NULL,
  query_text text NOT NULL,
  response jsonb NOT NULL,
  model text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL
);

-- ─── public.crm_alerts ───
CREATE TABLE public.crm_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  resolved_at timestamp with time zone,
  CONSTRAINT crm_alerts_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  type text NOT NULL,
  severity text DEFAULT 'medium'::text,
  message text NOT NULL,
  suggested_action text,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.crm_automation_logs ───
CREATE TABLE public.crm_automation_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  audit_context jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT crm_automation_logs_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid,
  automation_name text NOT NULL,
  status text NOT NULL,
  payload jsonb,
  result jsonb,
  execution_time_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.crm_automation_reprocess_queue ───
CREATE TABLE public.crm_automation_reprocess_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT crm_automation_reprocess_queue_pkey PRIMARY KEY (id),
  log_id uuid,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'::text,
  last_error text,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.crm_cadence_rules ───
CREATE TABLE public.crm_cadence_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_cadence_rules_pkey PRIMARY KEY (id),
  CONSTRAINT crm_cadence_rules_user_id_relationship_stage_version_key UNIQUE (user_id, relationship_stage, version),
  cadence_steps jsonb DEFAULT '[]'::jsonb,
  user_id uuid NOT NULL,
  relationship_stage text NOT NULL,
  frequency_days integer NOT NULL,
  priority text DEFAULT 'medium'::text,
  suggested_actions text[],
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.crm_consent_audit_logs ───
CREATE TABLE public.crm_consent_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT crm_consent_audit_logs_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  consent_type text NOT NULL,
  status text NOT NULL,
  source text NOT NULL,
  ip_address text,
  platform text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ─── public.crm_metric_overrides ───
CREATE TABLE public.crm_metric_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT crm_metric_overrides_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  metric_type text NOT NULL,
  old_value text,
  new_value text NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.crm_objection_intelligence ───
CREATE TABLE public.crm_objection_intelligence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT crm_objection_intelligence_pkey PRIMARY KEY (id),
  contact_id uuid,
  objection_type text NOT NULL,
  behavioral_profile text,
  suggested_strategy text,
  script_content text,
  success_rate numeric(5,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── public.crm_relationship_audit_logs ───
CREATE TABLE public.crm_relationship_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT crm_relationship_audit_logs_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  change_source text NOT NULL,
  trigger_name text,
  reason text
);

-- ─── public.cron_secrets ───
CREATE TABLE public.cron_secrets (
  name text NOT NULL,
  CONSTRAINT cron_secrets_pkey PRIMARY KEY (name),
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.cs_accounts ───
CREATE TABLE public.cs_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  renewal_date date,
  CONSTRAINT cs_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT cs_accounts_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100))),
  CONSTRAINT cs_accounts_health_trend_check CHECK ((health_trend = ANY (ARRAY['up'::text, 'stable'::text, 'down'::text]))),
  CONSTRAINT cs_accounts_lifecycle_stage_check CHECK ((lifecycle_stage = ANY (ARRAY['onboarding'::text, 'adopting'::text, 'mature'::text, 'at_risk'::text, 'churned'::text]))),
  CONSTRAINT cs_accounts_tier_check CHECK ((tier = ANY (ARRAY['strategic'::text, 'enterprise'::text, 'mid'::text, 'smb'::text]))),
  lifecycle_stage text DEFAULT 'onboarding'::text NOT NULL,
  health_score integer DEFAULT 50 NOT NULL,
  health_trend text DEFAULT 'stable'::text,
  notes text,
  last_health_recalc_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  csm_owner_id uuid,
  account_name text NOT NULL,
  tier text DEFAULT 'mid'::text NOT NULL,
  arr numeric DEFAULT 0 NOT NULL,
  contract_start date
);

-- ─── public.cs_health_signals ───
CREATE TABLE public.cs_health_signals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cs_health_signals_pkey PRIMARY KEY (id),
  CONSTRAINT cs_health_signals_signal_type_check CHECK ((signal_type = ANY (ARRAY['usage'::text, 'support'::text, 'engagement'::text, 'sentiment'::text, 'payment'::text, 'nps'::text]))),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  signal_type text NOT NULL,
  score numeric DEFAULT 0 NOT NULL,
  weight numeric DEFAULT 1 NOT NULL,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  captured_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.cs_nps_responses ───
CREATE TABLE public.cs_nps_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT cs_nps_responses_pkey PRIMARY KEY (id),
  CONSTRAINT cs_nps_responses_category_check CHECK ((category = ANY (ARRAY['promoter'::text, 'passive'::text, 'detractor'::text]))),
  CONSTRAINT cs_nps_responses_score_check CHECK (((score >= 0) AND (score <= 10))),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  contact_id uuid,
  score integer NOT NULL,
  category text NOT NULL,
  comment text,
  surveyed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.cs_qbrs ───
CREATE TABLE public.cs_qbrs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  next_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
  CONSTRAINT cs_qbrs_pkey PRIMARY KEY (id),
  CONSTRAINT cs_qbrs_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]))),
  attendees jsonb DEFAULT '[]'::jsonb NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  title text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  status text DEFAULT 'scheduled'::text NOT NULL,
  agenda jsonb DEFAULT '[]'::jsonb NOT NULL,
  outcomes jsonb DEFAULT '[]'::jsonb NOT NULL
);

-- ─── public.cs_renewals ───
CREATE TABLE public.cs_renewals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  closed_at timestamp with time zone,
  CONSTRAINT cs_renewals_pkey PRIMARY KEY (id),
  CONSTRAINT cs_renewals_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  CONSTRAINT cs_renewals_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'in_negotiation'::text, 'renewed'::text, 'churned'::text, 'downgraded'::text, 'expanded'::text]))),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  renewal_date date NOT NULL,
  status text DEFAULT 'upcoming'::text NOT NULL,
  forecasted_arr numeric DEFAULT 0 NOT NULL,
  actual_arr numeric,
  risk_level text DEFAULT 'low'::text NOT NULL,
  notes text
);

-- ─── public.csat_surveys ───
CREATE TABLE public.csat_surveys (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sent_at timestamp with time zone,
  CONSTRAINT csat_surveys_pkey PRIMARY KEY (id),
  CONSTRAINT csat_surveys_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text, 'in_app'::text, 'sms'::text]))),
  CONSTRAINT csat_surveys_score_check CHECK (((score >= 1) AND (score <= 5))),
  CONSTRAINT csat_surveys_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'answered'::text, 'expired'::text]))),
  answered_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  public_token uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  ticket_id uuid,
  score integer,
  feedback text,
  channel text DEFAULT 'email'::text,
  status text DEFAULT 'pending'::text NOT NULL
);

-- ─── public.custom_field_values ───
CREATE TABLE public.custom_field_values (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT custom_field_values_pkey PRIMARY KEY (id),
  CONSTRAINT custom_field_values_custom_field_id_entity_id_key UNIQUE (custom_field_id, entity_id),
  user_id uuid NOT NULL,
  custom_field_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  value text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.custom_fields ───
CREATE TABLE public.custom_fields (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT custom_fields_pkey PRIMARY KEY (id),
  CONSTRAINT custom_fields_user_id_entity_type_field_name_key UNIQUE (user_id, entity_type, field_name),
  CONSTRAINT custom_fields_entity_type_check CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text, 'deal'::text]))),
  CONSTRAINT custom_fields_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'number'::text, 'date'::text, 'select'::text, 'boolean'::text, 'url'::text, 'email'::text, 'phone'::text]))),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  field_options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0
);

-- ─── public.deal_forecasts ───
CREATE TABLE public.deal_forecasts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  forecasted_amount numeric DEFAULT 0 NOT NULL,
  CONSTRAINT deal_forecasts_pkey PRIMARY KEY (id),
  CONSTRAINT deal_forecasts_deal_id_period_id_key UNIQUE (deal_id, period_id),
  CONSTRAINT deal_forecasts_category_check CHECK ((category = ANY (ARRAY['commit'::text, 'best_case'::text, 'pipeline'::text, 'omitted'::text]))),
  CONSTRAINT deal_forecasts_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100))),
  CONSTRAINT deal_forecasts_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100))),
  forecasted_close_date date,
  stage text,
  risk_factors jsonb DEFAULT '[]'::jsonb NOT NULL,
  health_score integer DEFAULT 50 NOT NULL,
  last_activity_at timestamp with time zone,
  slip_count integer DEFAULT 0 NOT NULL,
  ai_rationale text,
  notes text,
  analyzed_at timestamp with time zone,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deal_id text NOT NULL,
  deal_name text,
  contact_id uuid,
  company_id uuid,
  period_id uuid NOT NULL,
  category text DEFAULT 'pipeline'::text NOT NULL,
  confidence_score integer DEFAULT 50 NOT NULL
);

-- ─── public.deal_room_activities ───
CREATE TABLE public.deal_room_activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT deal_room_activities_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_activities_actor_side_check CHECK ((actor_side = ANY (ARRAY['seller'::text, 'buyer'::text, 'system'::text]))),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  actor_side text NOT NULL,
  actor_label text,
  activity_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.deal_room_comments ───
CREATE TABLE public.deal_room_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT deal_room_comments_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_comments_author_side_check CHECK ((author_side = ANY (ARRAY['seller'::text, 'buyer'::text]))),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  author_side text NOT NULL,
  author_label text,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.deal_room_documents ───
CREATE TABLE public.deal_room_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  last_viewed_at timestamp with time zone,
  CONSTRAINT deal_room_documents_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_documents_uploaded_by_side_check CHECK ((uploaded_by_side = ANY (ARRAY['seller'::text, 'buyer'::text]))),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by_side text DEFAULT 'seller'::text NOT NULL,
  view_count integer DEFAULT 0 NOT NULL
);

-- ─── public.deal_room_milestones ───
CREATE TABLE public.deal_room_milestones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  completed_at timestamp with time zone,
  CONSTRAINT deal_room_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_milestones_completed_by_side_check CHECK ((completed_by_side = ANY (ARRAY['seller'::text, 'buyer'::text]))),
  CONSTRAINT deal_room_milestones_owner_side_check CHECK ((owner_side = ANY (ARRAY['seller'::text, 'buyer'::text, 'both'::text]))),
  CONSTRAINT deal_room_milestones_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'done'::text, 'blocked'::text]))),
  completed_by_side text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status text DEFAULT 'pending'::text NOT NULL,
  owner_side text DEFAULT 'both'::text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);

-- ─── public.deal_room_stakeholders ───
CREATE TABLE public.deal_room_stakeholders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  engagement_score integer DEFAULT 50 NOT NULL,
  CONSTRAINT deal_room_stakeholders_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_stakeholders_engagement_score_check CHECK (((engagement_score >= 0) AND (engagement_score <= 100))),
  CONSTRAINT deal_room_stakeholders_influence_check CHECK ((influence = ANY (ARRAY['champion'::text, 'decision_maker'::text, 'influencer'::text, 'blocker'::text, 'user'::text]))),
  CONSTRAINT deal_room_stakeholders_side_check CHECK ((side = ANY (ARRAY['seller'::text, 'buyer'::text]))),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  name text NOT NULL,
  email text,
  role_title text,
  side text NOT NULL,
  influence text DEFAULT 'user'::text NOT NULL
);

-- ─── public.deal_rooms ───
CREATE TABLE public.deal_rooms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  target_close_date date,
  CONSTRAINT deal_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT deal_rooms_share_token_key UNIQUE (share_token),
  CONSTRAINT deal_rooms_status_check CHECK ((status = ANY (ARRAY['active'::text, 'won'::text, 'lost'::text, 'paused'::text]))),
  share_token text DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text) NOT NULL,
  share_enabled boolean DEFAULT false NOT NULL,
  last_buyer_view_at timestamp with time zone,
  buyer_view_count integer DEFAULT 0 NOT NULL,
  health_score integer,
  health_recommendations jsonb DEFAULT '[]'::jsonb NOT NULL,
  health_analyzed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  deal_id text,
  deal_name text,
  company_id uuid,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active'::text NOT NULL,
  deal_value numeric
);

-- ─── public.deals ───
CREATE TABLE public.deals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  expected_closing_date date,
  CONSTRAINT deals_pkey PRIMARY KEY (id),
  CONSTRAINT deals_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
  CONSTRAINT deals_status_check CHECK ((status = ANY (ARRAY['open'::text, 'won'::text, 'lost'::text, 'on_hold'::text]))),
  status text DEFAULT 'open'::text NOT NULL,
  loss_reason text,
  notes text,
  priority text DEFAULT 'medium'::text,
  tags text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  pipeline_id uuid,
  stage_id uuid,
  title text NOT NULL,
  value numeric(15,2) DEFAULT 0,
  probability integer DEFAULT 10
);

-- ─── public.decision_criteria ───
CREATE TABLE public.decision_criteria (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT decision_criteria_pkey PRIMARY KEY (id),
  CONSTRAINT decision_criteria_criteria_type_check CHECK ((criteria_type = ANY (ARRAY['must_have'::text, 'nice_to_have'::text, 'deal_breaker'::text]))),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  name text NOT NULL,
  priority integer DEFAULT 1,
  criteria_type text NOT NULL,
  detected_from text,
  how_to_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.device_login_notifications ───
CREATE TABLE public.device_login_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT device_login_notifications_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  device_id uuid,
  ip_address text,
  location text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.disc_analysis_history ───
CREATE TABLE public.disc_analysis_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  secondary_profile text,
  CONSTRAINT disc_analysis_history_pkey PRIMARY KEY (id),
  CONSTRAINT disc_analysis_history_analysis_source_check CHECK ((analysis_source = ANY (ARRAY['manual'::text, 'ai_analysis'::text, 'questionnaire'::text, 'behavior_tracking'::text]))),
  CONSTRAINT disc_analysis_history_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100))),
  CONSTRAINT disc_analysis_history_conscientiousness_score_check CHECK (((conscientiousness_score >= 0) AND (conscientiousness_score <= 100))),
  CONSTRAINT disc_analysis_history_dominance_score_check CHECK (((dominance_score >= 0) AND (dominance_score <= 100))),
  CONSTRAINT disc_analysis_history_influence_score_check CHECK (((influence_score >= 0) AND (influence_score <= 100))),
  CONSTRAINT disc_analysis_history_primary_profile_check CHECK ((primary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  CONSTRAINT disc_analysis_history_secondary_profile_check CHECK ((secondary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  CONSTRAINT disc_analysis_history_steadiness_score_check CHECK (((steadiness_score >= 0) AND (steadiness_score <= 100))),
  CONSTRAINT disc_analysis_history_stress_primary_check CHECK ((stress_primary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  CONSTRAINT disc_analysis_history_stress_secondary_check CHECK ((stress_secondary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  blend_profile text,
  stress_primary text,
  stress_secondary text,
  confidence integer DEFAULT 50 NOT NULL,
  analysis_source text DEFAULT 'manual'::text NOT NULL,
  detected_keywords jsonb DEFAULT '[]'::jsonb,
  detected_phrases jsonb DEFAULT '[]'::jsonb,
  behavior_indicators jsonb DEFAULT '[]'::jsonb,
  analyzed_text text,
  user_id uuid NOT NULL,
  analysis_notes text,
  profile_summary text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  dominance_score integer DEFAULT 0 NOT NULL,
  influence_score integer DEFAULT 0 NOT NULL,
  steadiness_score integer DEFAULT 0 NOT NULL,
  conscientiousness_score integer DEFAULT 0 NOT NULL,
  primary_profile text NOT NULL
);

-- ─── public.disc_analysis_history_audit ───
CREATE TABLE public.disc_analysis_history_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT disc_analysis_history_audit_pkey PRIMARY KEY (id),
  analysis_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.disc_communication_logs ───
CREATE TABLE public.disc_communication_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  outcome_notes text,
  CONSTRAINT disc_communication_logs_pkey PRIMARY KEY (id),
  CONSTRAINT disc_communication_logs_communication_outcome_check CHECK ((communication_outcome = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))),
  CONSTRAINT disc_communication_logs_contact_disc_profile_check CHECK ((contact_disc_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  CONSTRAINT disc_communication_logs_effectiveness_rating_check CHECK (((effectiveness_rating >= 1) AND (effectiveness_rating <= 5))),
  effectiveness_rating integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  contact_disc_profile text NOT NULL,
  approach_adapted boolean DEFAULT false NOT NULL,
  adaptation_tips_shown jsonb DEFAULT '[]'::jsonb,
  tips_followed jsonb DEFAULT '[]'::jsonb,
  communication_outcome text
);

-- ─── public.disc_conversion_metrics ───
CREATE TABLE public.disc_conversion_metrics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  average_deal_size numeric,
  CONSTRAINT disc_conversion_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT disc_conversion_metrics_user_id_disc_profile_period_start_p_key UNIQUE (user_id, disc_profile, period_start, period_end),
  CONSTRAINT disc_conversion_metrics_disc_profile_check CHECK ((disc_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  average_sales_cycle_days integer,
  average_relationship_score numeric(5,2),
  average_compatibility_score numeric(5,2),
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  disc_profile text NOT NULL,
  blend_profile text,
  total_contacts integer DEFAULT 0 NOT NULL,
  total_opportunities integer DEFAULT 0 NOT NULL,
  converted_count integer DEFAULT 0 NOT NULL,
  lost_count integer DEFAULT 0 NOT NULL,
  conversion_rate numeric(5,2)
);

-- ─── public.disc_profile_config ───
CREATE TABLE public.disc_profile_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  communication_style jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT disc_profile_config_pkey PRIMARY KEY (id),
  CONSTRAINT disc_profile_config_profile_type_key UNIQUE (profile_type),
  CONSTRAINT disc_profile_config_profile_type_check CHECK ((profile_type = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text, 'DI'::text, 'DC'::text, 'ID'::text, 'IS'::text, 'SI'::text, 'SC'::text, 'CS'::text, 'CD'::text]))),
  preferred_pace text NOT NULL,
  decision_making_style text NOT NULL,
  opening_strategies jsonb DEFAULT '[]'::jsonb NOT NULL,
  presentation_tips jsonb DEFAULT '[]'::jsonb NOT NULL,
  objection_handling jsonb DEFAULT '[]'::jsonb NOT NULL,
  closing_techniques jsonb DEFAULT '[]'::jsonb NOT NULL,
  follow_up_approach jsonb DEFAULT '[]'::jsonb NOT NULL,
  power_words jsonb DEFAULT '[]'::jsonb NOT NULL,
  avoid_words jsonb DEFAULT '[]'::jsonb NOT NULL,
  profile_type text NOT NULL,
  detection_keywords jsonb DEFAULT '[]'::jsonb NOT NULL,
  typical_phrases jsonb DEFAULT '[]'::jsonb NOT NULL,
  compatibility_matrix jsonb DEFAULT '{}'::jsonb NOT NULL,
  color_scheme jsonb DEFAULT '{}'::jsonb NOT NULL,
  icon text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  detailed_description text NOT NULL,
  core_drive text NOT NULL,
  core_fear text NOT NULL,
  under_pressure text NOT NULL,
  ideal_environment text NOT NULL
);

-- ─── public.document_signatures ───
CREATE TABLE public.document_signatures (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  merge_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT document_signatures_pkey PRIMARY KEY (id),
  CONSTRAINT document_signatures_signature_token_key UNIQUE (signature_token),
  status text DEFAULT 'pending'::text NOT NULL,
  signature_token text DEFAULT encode(extensions.gen_random_bytes(24), 'hex'::text) NOT NULL,
  signature_image text,
  signature_typed text,
  signed_ip text,
  signed_user_agent text,
  viewed_at timestamp with time zone,
  signed_at timestamp with time zone,
  declined_at timestamp with time zone,
  user_id uuid NOT NULL,
  declined_reason text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  document_id uuid,
  template_id uuid,
  contact_id uuid,
  company_id uuid,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  rendered_html text NOT NULL
);

-- ─── public.document_templates ───
CREATE TABLE public.document_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  usage_count integer DEFAULT 0 NOT NULL,
  CONSTRAINT document_templates_pkey PRIMARY KEY (id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  document_type text DEFAULT 'contract'::text NOT NULL,
  content_html text NOT NULL,
  merge_fields jsonb DEFAULT '[]'::jsonb NOT NULL,
  category text,
  is_active boolean DEFAULT true NOT NULL
);

-- ─── public.document_views ───
CREATE TABLE public.document_views (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT document_views_pkey PRIMARY KEY (id),
  signature_id uuid,
  document_id uuid,
  viewer_ip text,
  viewer_user_agent text,
  viewer_email text,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.documents ───
CREATE TABLE public.documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  mime_type text,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_document_type_check CHECK ((document_type = ANY (ARRAY['contract'::text, 'proposal'::text, 'nda'::text, 'invoice'::text, 'report'::text, 'presentation'::text, 'spreadsheet'::text, 'image'::text, 'other'::text]))),
  CONSTRAINT documents_entity_type_check CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text, 'deal'::text]))),
  CONSTRAINT documents_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'draft'::text]))),
  version integer DEFAULT 1,
  status text DEFAULT 'active'::text,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  document_type text DEFAULT 'other'::text NOT NULL,
  file_url text NOT NULL,
  file_size integer
);

-- ─── public.email_campaigns ───
CREATE TABLE public.email_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  scheduled_at timestamp with time zone,
  CONSTRAINT email_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT email_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'cancelled'::text]))),
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  investment numeric(12,2) DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  user_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  content_html text,
  content_text text,
  status text DEFAULT 'draft'::text NOT NULL,
  segment_filter jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[]
);

-- ─── public.email_finder_results ───
CREATE TABLE public.email_finder_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  best_confidence integer DEFAULT 0 NOT NULL,
  CONSTRAINT email_finder_results_pkey PRIMARY KEY (id),
  CONSTRAINT email_finder_results_best_confidence_check CHECK (((best_confidence >= 0) AND (best_confidence <= 100))),
  sources jsonb DEFAULT '[]'::jsonb NOT NULL,
  found_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  full_name text NOT NULL,
  first_name text,
  last_name text,
  domain text NOT NULL,
  candidates jsonb DEFAULT '[]'::jsonb NOT NULL,
  best_email text
);

-- ─── public.email_thread_summaries ───
CREATE TABLE public.email_thread_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  generated_by_model text DEFAULT 'google/gemini-2.5-flash'::text NOT NULL,
  CONSTRAINT email_thread_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT email_thread_summaries_user_id_thread_key_key UNIQUE (user_id, thread_key),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  thread_key text NOT NULL,
  interaction_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  summary text NOT NULL,
  key_points text[] DEFAULT '{}'::text[] NOT NULL,
  action_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  sentiment text,
  next_steps text[] DEFAULT '{}'::text[] NOT NULL
);

-- ─── public.email_verifications ───
CREATE TABLE public.email_verifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  role_account boolean DEFAULT false NOT NULL,
  CONSTRAINT email_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT email_verifications_score_check CHECK (((score >= 0) AND (score <= 100))),
  CONSTRAINT email_verifications_status_check CHECK ((status = ANY (ARRAY['valid'::text, 'invalid'::text, 'risky'::text, 'unknown'::text, 'catchall'::text]))),
  free_provider boolean DEFAULT false NOT NULL,
  reasons text[] DEFAULT ARRAY[]::text[] NOT NULL,
  provider text DEFAULT 'internal'::text NOT NULL,
  raw jsonb DEFAULT '{}'::jsonb NOT NULL,
  verified_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  email text NOT NULL,
  status text DEFAULT 'unknown'::text NOT NULL,
  score integer DEFAULT 0 NOT NULL,
  mx_found boolean DEFAULT false NOT NULL,
  smtp_check boolean DEFAULT false NOT NULL,
  disposable boolean DEFAULT false NOT NULL
);

-- ─── public.emotional_anchors ───
CREATE TABLE public.emotional_anchors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT emotional_anchors_pkey PRIMARY KEY (id),
  CONSTRAINT emotional_anchors_anchor_type_check CHECK ((anchor_type = ANY (ARRAY['positive'::text, 'negative'::text]))),
  CONSTRAINT emotional_anchors_strength_check CHECK (((strength >= 1) AND (strength <= 10))),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  anchor_type text NOT NULL,
  trigger_word text NOT NULL,
  emotional_state text NOT NULL,
  context text,
  strength integer DEFAULT 5,
  detected_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.emotional_states_history ───
CREATE TABLE public.emotional_states_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT emotional_states_history_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  emotional_state text NOT NULL,
  confidence integer DEFAULT 50,
  trigger text,
  context text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.entity_relationships ───
CREATE TABLE public.entity_relationships (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  notes text,
  CONSTRAINT entity_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT entity_relationships_unique UNIQUE (from_type, from_id, to_type, to_id, role),
  CONSTRAINT entity_relationships_no_self CHECK ((NOT ((from_type = to_type) AND (from_id = to_id)))),
  CONSTRAINT entity_relationships_period_valid CHECK (((ended_at IS NULL) OR (started_at IS NULL) OR (ended_at >= started_at))),
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  from_type entity_type NOT NULL,
  from_id uuid NOT NULL,
  to_type entity_type NOT NULL,
  to_id uuid NOT NULL,
  role entity_relationship_role NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  started_at date,
  ended_at date
);
COMMENT ON TABLE public.entity_relationships IS 'Relacionamentos polimórficos entre Empresa/Pessoa com papel (comprador, gerente, proprietário, ...).';

-- ─── public.eq_analysis_history ───
CREATE TABLE public.eq_analysis_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  strengths text[],
  CONSTRAINT eq_analysis_history_pkey PRIMARY KEY (id),
  CONSTRAINT eq_analysis_history_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100))),
  CONSTRAINT eq_analysis_history_overall_score_check CHECK (((overall_score >= 0) AND (overall_score <= 100))),
  areas_for_growth text[],
  sales_implications jsonb,
  communication_style jsonb,
  profile_summary text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  overall_score integer NOT NULL,
  overall_level text NOT NULL,
  confidence integer,
  pillar_scores jsonb NOT NULL,
  indicators jsonb
);

-- ─── public.error_logs ───
CREATE TABLE public.error_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT error_logs_pkey PRIMARY KEY (id),
  message text NOT NULL,
  stack text,
  context jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  severity error_severity DEFAULT 'error'::error_severity NOT NULL,
  url text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.favorite_templates ───
CREATE TABLE public.favorite_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT favorite_templates_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_templates_user_id_template_id_key UNIQUE (user_id, template_id),
  user_id uuid NOT NULL,
  template_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.feature_flags ───
CREATE TABLE public.feature_flags (
  name text NOT NULL,
  CONSTRAINT feature_flags_pkey PRIMARY KEY (name),
  enabled boolean DEFAULT false NOT NULL,
  description text,
  roles text[] DEFAULT ARRAY[]::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.ficha360_conversation_summaries ───
CREATE TABLE public.ficha360_conversation_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ficha360_conversation_summaries_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  filters_hash text NOT NULL,
  interaction_ids uuid[] NOT NULL,
  filters_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  summary jsonb NOT NULL,
  model text NOT NULL,
  interactions_analyzed integer DEFAULT 0 NOT NULL
);

-- ─── public.follow_up_approvals ───
CREATE TABLE public.follow_up_approvals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follow_up_approvals_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  channel text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  scheduled_for timestamp with time zone,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.follow_up_approvals_v2 ───
CREATE TABLE public.follow_up_approvals_v2 (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT follow_up_approvals_v2_pkey PRIMARY KEY (id),
  contact_id text,
  user_id uuid NOT NULL,
  content text NOT NULL,
  channel text DEFAULT 'whatsapp'::text,
  status text DEFAULT 'pending'::text,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── public.forecast_categories_history ───
CREATE TABLE public.forecast_categories_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT forecast_categories_history_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_categories_history_changed_by_check CHECK ((changed_by = ANY (ARRAY['user'::text, 'ai'::text, 'system'::text]))),
  user_id uuid NOT NULL,
  deal_forecast_id uuid NOT NULL,
  from_category text,
  to_category text NOT NULL,
  changed_by text DEFAULT 'user'::text NOT NULL,
  reason text,
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.forecast_periods ───
CREATE TABLE public.forecast_periods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  notes text,
  CONSTRAINT forecast_periods_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_periods_user_id_period_type_period_start_key UNIQUE (user_id, period_type, period_start),
  CONSTRAINT forecast_periods_period_type_check CHECK ((period_type = ANY (ARRAY['month'::text, 'quarter'::text]))),
  CONSTRAINT forecast_periods_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text]))),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  period_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  quota_amount numeric DEFAULT 0 NOT NULL,
  actual_won_amount numeric DEFAULT 0 NOT NULL,
  status text DEFAULT 'open'::text NOT NULL,
  closed_at timestamp with time zone
);

-- ─── public.forecast_quota_settings ───
CREATE TABLE public.forecast_quota_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slip_threshold_days integer DEFAULT 7 NOT NULL,
  CONSTRAINT forecast_quota_settings_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_quota_settings_user_id_key UNIQUE (user_id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  default_monthly_quota numeric DEFAULT 0 NOT NULL,
  default_quarterly_quota numeric DEFAULT 0 NOT NULL,
  health_weight_activity integer DEFAULT 30 NOT NULL,
  health_weight_stage_age integer DEFAULT 25 NOT NULL,
  health_weight_engagement integer DEFAULT 25 NOT NULL,
  health_weight_relationship integer DEFAULT 20 NOT NULL,
  inactivity_threshold_days integer DEFAULT 14 NOT NULL
);

-- ─── public.forecast_snapshots ───
CREATE TABLE public.forecast_snapshots (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  snapshot_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT forecast_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_snapshots_period_id_snapshot_date_key UNIQUE (period_id, snapshot_date),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  period_id uuid NOT NULL,
  snapshot_date date DEFAULT CURRENT_DATE NOT NULL,
  commit_total numeric DEFAULT 0 NOT NULL,
  best_case_total numeric DEFAULT 0 NOT NULL,
  pipeline_total numeric DEFAULT 0 NOT NULL,
  weighted_total numeric DEFAULT 0 NOT NULL,
  deal_count integer DEFAULT 0 NOT NULL
);

-- ─── public.form_submissions ───
CREATE TABLE public.form_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  utm_content text,
  CONSTRAINT form_submissions_pkey PRIMARY KEY (id),
  utm_term text,
  page_url text,
  user_agent text,
  ip_hash text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  form_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  routed_to uuid,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

-- ─── public.forms ───
CREATE TABLE public.forms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  success_message text DEFAULT 'Obrigado! Recebemos seus dados.'::text,
  CONSTRAINT forms_pkey PRIMARY KEY (id),
  CONSTRAINT forms_slug_key UNIQUE (slug),
  is_published boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  submission_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  fields jsonb DEFAULT '[]'::jsonb NOT NULL,
  routing_rules jsonb DEFAULT '{"type": "round_robin", "members": []}'::jsonb NOT NULL,
  nurturing_workflow_id uuid,
  redirect_url text
);

-- ─── public.geo_allowed_countries ───
CREATE TABLE public.geo_allowed_countries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT geo_allowed_countries_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  country_code text NOT NULL,
  country_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.handoff_requests ───
CREATE TABLE public.handoff_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  notes text,
  CONSTRAINT handoff_requests_pkey PRIMARY KEY (id),
  CONSTRAINT handoff_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'cancelled'::text]))),
  rejection_reason text,
  sla_hours integer DEFAULT 4 NOT NULL,
  accepted_at timestamp with time zone,
  rejected_at timestamp with time zone,
  expired_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  from_member_id uuid NOT NULL,
  to_member_id uuid,
  status text DEFAULT 'pending'::text NOT NULL,
  qualification_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  handoff_reason text
);

-- ─── public.health_alert_settings ───
CREATE TABLE public.health_alert_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email_address text,
  CONSTRAINT health_alert_settings_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_health_settings UNIQUE (user_id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  critical_threshold integer DEFAULT 30,
  warning_threshold integer DEFAULT 50,
  check_frequency_hours integer DEFAULT 24,
  notify_on_critical boolean DEFAULT true,
  notify_on_warning boolean DEFAULT false
);

-- ─── public.health_alerts ───
CREATE TABLE public.health_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  dismissed boolean DEFAULT false,
  CONSTRAINT health_alerts_pkey PRIMARY KEY (id),
  notified_via text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  alert_type text DEFAULT 'critical'::text NOT NULL,
  health_score integer NOT NULL,
  previous_score integer,
  title text NOT NULL,
  description text,
  factors jsonb
);

-- ─── public.hidden_objections ───
CREATE TABLE public.hidden_objections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  suggested_probe text,
  CONSTRAINT hidden_objections_pkey PRIMARY KEY (id),
  CONSTRAINT hidden_objections_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
  CONSTRAINT hidden_objections_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  resolution_templates text[],
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  objection_type text NOT NULL,
  indicator text NOT NULL,
  probability integer DEFAULT 50,
  severity text NOT NULL,
  possible_real_objection text
);

-- ─── public.incoming_webhook_dlq ───
CREATE TABLE public.incoming_webhook_dlq (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  CONSTRAINT incoming_webhook_dlq_pkey PRIMARY KEY (id),
  CONSTRAINT incoming_webhook_dlq_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'abandoned'::text]))),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  webhook_id uuid NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  source_ip text,
  user_agent text,
  attempts integer DEFAULT 0 NOT NULL,
  max_attempts integer DEFAULT 5 NOT NULL,
  next_retry_at timestamp with time zone DEFAULT now() NOT NULL,
  last_error text
);

-- ─── public.incoming_webhook_logs ───
CREATE TABLE public.incoming_webhook_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  latency_ms integer,
  CONSTRAINT incoming_webhook_logs_pkey PRIMARY KEY (id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  webhook_id uuid NOT NULL,
  status text NOT NULL,
  http_status integer,
  payload jsonb,
  response jsonb,
  error_message text,
  source_ip text,
  user_agent text
);

-- ─── public.incoming_webhooks ───
CREATE TABLE public.incoming_webhooks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  total_errors bigint DEFAULT 0 NOT NULL,
  CONSTRAINT incoming_webhooks_pkey PRIMARY KEY (id),
  CONSTRAINT incoming_webhooks_token_key UNIQUE (token),
  CONSTRAINT incoming_webhooks_target_entity_check CHECK ((target_entity = ANY (ARRAY['contact'::text, 'company'::text, 'deal'::text, 'interaction'::text, 'note'::text, 'custom'::text]))),
  last_called_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  webhook_secret text,
  require_signature boolean DEFAULT false NOT NULL,
  replay_window_seconds integer DEFAULT 300 NOT NULL,
  name text NOT NULL,
  description text,
  token text NOT NULL,
  target_entity text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  allowed_origins text[] DEFAULT ARRAY[]::text[],
  field_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
  total_calls bigint DEFAULT 0 NOT NULL
);

-- ─── public.insights ───
CREATE TABLE public.insights (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  action_suggestion text,
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_category_check CHECK ((category = ANY (ARRAY['personality'::text, 'preference'::text, 'behavior'::text, 'opportunity'::text, 'risk'::text, 'relationship'::text]))),
  CONSTRAINT insights_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100))),
  expires_at timestamp with time zone,
  dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  confidence integer DEFAULT 50,
  source text,
  actionable boolean DEFAULT false
);

-- ─── public.intent_scores ───
CREATE TABLE public.intent_scores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT intent_scores_pkey PRIMARY KEY (id),
  CONSTRAINT intent_scores_user_id_scope_scope_id_key UNIQUE (user_id, scope, scope_id),
  CONSTRAINT intent_scores_intent_score_check CHECK (((intent_score >= 0) AND (intent_score <= 100))),
  CONSTRAINT intent_scores_scope_check CHECK ((scope = ANY (ARRAY['contact'::text, 'account'::text]))),
  CONSTRAINT intent_scores_score_trend_check CHECK ((score_trend = ANY (ARRAY['rising'::text, 'stable'::text, 'falling'::text]))),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  scope text NOT NULL,
  scope_id text NOT NULL,
  intent_score integer DEFAULT 0 NOT NULL,
  score_trend text DEFAULT 'stable'::text NOT NULL,
  signal_count_30d integer DEFAULT 0 NOT NULL,
  top_signals jsonb DEFAULT '[]'::jsonb NOT NULL,
  computed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.intent_signals ───
CREATE TABLE public.intent_signals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT intent_signals_pkey PRIMARY KEY (id),
  CONSTRAINT intent_signals_signal_type_check CHECK ((signal_type = ANY (ARRAY['page_view'::text, 'email_open'::text, 'email_click'::text, 'form_submit'::text, 'content_download'::text, 'pricing_view'::text, 'demo_request'::text, 'social_engagement'::text, 'search_query'::text, 'competitor_mention'::text]))),
  CONSTRAINT intent_signals_weight_check CHECK (((weight >= 1) AND (weight <= 10))),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  external_company_id text,
  signal_type text NOT NULL,
  signal_source text,
  signal_value jsonb DEFAULT '{}'::jsonb NOT NULL,
  weight integer DEFAULT 1 NOT NULL
);

-- ─── public.intent_tracking_pixels ───
CREATE TABLE public.intent_tracking_pixels (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT intent_tracking_pixels_pkey PRIMARY KEY (id),
  CONSTRAINT intent_tracking_pixels_pixel_key_key UNIQUE (pixel_key),
  user_id uuid NOT NULL,
  pixel_key text NOT NULL,
  domain text NOT NULL,
  label text,
  active boolean DEFAULT true NOT NULL,
  signal_count integer DEFAULT 0 NOT NULL,
  last_signal_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── public.interaction_summaries ───
CREATE TABLE public.interaction_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interaction_summaries_pkey PRIMARY KEY (id),
  updated_at timestamp with time zone DEFAULT now(),
  contact_id uuid,
  company_id uuid,
  user_id uuid,
  summary text,
  key_takeaways jsonb DEFAULT '[]'::jsonb,
  next_steps text,
  negotiation_stage_summary text,
  last_interaction_id uuid
);

-- ─── public.interactions ───
CREATE TABLE public.interactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sentiment text DEFAULT 'neutral'::text,
  CONSTRAINT interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interactions_initiated_by_check CHECK ((initiated_by = ANY (ARRAY['us'::text, 'them'::text]))),
  CONSTRAINT interactions_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))),
  CONSTRAINT interactions_type_check CHECK ((type = ANY (ARRAY['whatsapp'::text, 'call'::text, 'email'::text, 'meeting'::text, 'note'::text, 'social'::text]))),
  tags text[] DEFAULT '{}'::text[],
  duration integer,
  attachments text[] DEFAULT '{}'::text[],
  initiated_by text DEFAULT 'us'::text,
  response_time integer,
  key_insights text[] DEFAULT '{}'::text[],
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  emotion_analysis jsonb,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  external_id text,
  nlp_analysis jsonb DEFAULT '{}'::jsonb,
  transcription_metadata jsonb DEFAULT '{}'::jsonb,
  contact_id uuid NOT NULL,
  company_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  content text,
  audio_url text,
  transcription text
);

-- ─── public.interactions_audit ───
CREATE TABLE public.interactions_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT interactions_audit_pkey PRIMARY KEY (id),
  interaction_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now()
);

-- ─── public.ip_whitelist ───
CREATE TABLE public.ip_whitelist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT ip_whitelist_pkey PRIMARY KEY (id),
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  label text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── public.knowledge_base_articles ───
CREATE TABLE public.knowledge_base_articles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT knowledge_base_articles_pkey PRIMARY KEY (id),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral'::text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  is_published boolean DEFAULT true,
  views_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0
);
