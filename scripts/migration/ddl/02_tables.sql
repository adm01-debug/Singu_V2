-- ============================================================================
-- TABLES (regenerado, ordenação corrigida)
-- ============================================================================

-- ─── public.abm_account_plans ───
CREATE TABLE public.abm_account_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  template_type text DEFAULT 'strategic'::text NOT NULL,
  goal text,
  objectives jsonb DEFAULT '[]'::jsonb NOT NULL,
  strategies jsonb DEFAULT '[]'::jsonb NOT NULL,
  key_stakeholders jsonb DEFAULT '[]'::jsonb NOT NULL,
  milestones jsonb DEFAULT '[]'::jsonb NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  target_revenue numeric,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT abm_account_plans_pkey PRIMARY KEY (id),
  CONSTRAINT abm_account_plans_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text]))),
  CONSTRAINT abm_account_plans_template_type_check CHECK ((template_type = ANY (ARRAY['strategic'::text, 'growth'::text, 'retention'::text, 'penetration'::text])))
);

-- ─── public.abm_accounts ───
CREATE TABLE public.abm_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  external_company_id text NOT NULL,
  company_name text NOT NULL,
  parent_account_id uuid,
  tier text DEFAULT 'mid'::text NOT NULL,
  account_score integer DEFAULT 0 NOT NULL,
  score_breakdown jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  assigned_to uuid,
  target_revenue numeric,
  notes text,
  last_scored_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT abm_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT abm_accounts_user_id_external_company_id_key UNIQUE (user_id, external_company_id),
  CONSTRAINT abm_accounts_account_score_check CHECK (((account_score >= 0) AND (account_score <= 100))),
  CONSTRAINT abm_accounts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'nurture'::text, 'closed_won'::text, 'closed_lost'::text, 'paused'::text]))),
  CONSTRAINT abm_accounts_tier_check CHECK ((tier = ANY (ARRAY['strategic'::text, 'enterprise'::text, 'mid'::text, 'smb'::text])))
);

-- ─── public.abm_buying_committee ───
CREATE TABLE public.abm_buying_committee (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  external_contact_id text,
  contact_name text NOT NULL,
  contact_email text,
  contact_role text,
  committee_role text NOT NULL,
  influence_level integer DEFAULT 5 NOT NULL,
  engagement_score integer DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT abm_buying_committee_pkey PRIMARY KEY (id),
  CONSTRAINT abm_buying_committee_committee_role_check CHECK ((committee_role = ANY (ARRAY['decision_maker'::text, 'influencer'::text, 'champion'::text, 'blocker'::text, 'user'::text, 'technical'::text, 'economic'::text]))),
  CONSTRAINT abm_buying_committee_engagement_score_check CHECK (((engagement_score >= 0) AND (engagement_score <= 100))),
  CONSTRAINT abm_buying_committee_influence_level_check CHECK (((influence_level >= 1) AND (influence_level <= 10)))
);

-- ─── public.abm_campaigns ───
CREATE TABLE public.abm_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL,
  target_account_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
  channels text[] DEFAULT ARRAY[]::text[] NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  start_date date,
  end_date date,
  budget numeric,
  metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT abm_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT abm_campaigns_campaign_type_check CHECK ((campaign_type = ANY (ARRAY['one_to_one'::text, 'one_to_few'::text, 'one_to_many'::text]))),
  CONSTRAINT abm_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'archived'::text])))
);

-- ─── public.abm_whitespace_opportunities ───
CREATE TABLE public.abm_whitespace_opportunities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  opportunity_type text NOT NULL,
  product_category text NOT NULL,
  estimated_value numeric,
  confidence integer DEFAULT 50 NOT NULL,
  rationale text,
  status text DEFAULT 'identified'::text NOT NULL,
  identified_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT abm_whitespace_opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT abm_whitespace_opportunities_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100))),
  CONSTRAINT abm_whitespace_opportunities_opportunity_type_check CHECK ((opportunity_type = ANY (ARRAY['cross_sell'::text, 'up_sell'::text, 'expansion'::text, 'renewal'::text]))),
  CONSTRAINT abm_whitespace_opportunities_status_check CHECK ((status = ANY (ARRAY['identified'::text, 'pursuing'::text, 'won'::text, 'lost'::text, 'dismissed'::text])))
);

-- ─── public.access_blocked_log ───
CREATE TABLE public.access_blocked_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  ip_address text,
  country_code text,
  city text,
  reason text NOT NULL,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT access_blocked_log_pkey PRIMARY KEY (id)
);

-- ─── public.access_security_settings ───
CREATE TABLE public.access_security_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  enable_ip_restriction boolean DEFAULT false,
  enable_geo_blocking boolean DEFAULT false,
  enable_device_detection boolean DEFAULT true,
  notify_new_device boolean DEFAULT true,
  max_sessions integer DEFAULT 5,
  session_timeout_minutes integer DEFAULT 480,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT access_security_settings_pkey PRIMARY KEY (id),
  CONSTRAINT access_security_settings_user_id_key UNIQUE (user_id)
);

-- ─── public.activities ───
CREATE TABLE public.activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_entity_type_check CHECK ((entity_type = ANY (ARRAY['company'::text, 'contact'::text, 'interaction'::text, 'insight'::text, 'alert'::text]))),
  CONSTRAINT activities_type_check CHECK ((type = ANY (ARRAY['company_created'::text, 'contact_created'::text, 'interaction_added'::text, 'insight_generated'::text, 'tag_added'::text, 'profile_updated'::text, 'alert_triggered'::text])))
);

-- ─── public.ai_chat_messages ───
CREATE TABLE public.ai_chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  tokens_used integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);

-- ─── public.ai_chat_threads ───
CREATE TABLE public.ai_chat_threads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text DEFAULT 'Nova conversa'::text NOT NULL,
  context_entity_type text,
  context_entity_id uuid,
  pinned boolean DEFAULT false NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  last_message_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ai_chat_threads_pkey PRIMARY KEY (id)
);

-- ─── public.ai_recommendation_audit_logs ───
CREATE TABLE public.ai_recommendation_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  score double precision NOT NULL,
  recommendation_type text NOT NULL,
  reasons text[] DEFAULT '{}'::text[] NOT NULL,
  data_used jsonb DEFAULT '{}'::jsonb,
  user_action text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_recommendation_audit_logs_pkey PRIMARY KEY (id)
);

-- ─── public.ai_recommendation_audit_logs_v2 ───
CREATE TABLE public.ai_recommendation_audit_logs_v2 (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id text,
  user_id uuid NOT NULL,
  score integer,
  recommendation_type text NOT NULL,
  reasons text[],
  data_used jsonb DEFAULT '{}'::jsonb,
  user_action text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_recommendation_audit_logs_v2_pkey PRIMARY KEY (id)
);

-- ─── public.ai_recommendation_logs ───
CREATE TABLE public.ai_recommendation_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  recommendation_score double precision NOT NULL,
  recommendation_reasons jsonb NOT NULL,
  input_data_snapshot jsonb NOT NULL,
  user_action text,
  action_timestamp timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_recommendation_logs_pkey PRIMARY KEY (id)
);

-- ─── public.ai_tone_preferences ───
CREATE TABLE public.ai_tone_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid,
  preferred_tone text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ai_tone_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT ai_tone_preferences_user_id_company_id_key UNIQUE (user_id, company_id)
);

-- ─── public.alerts ───
CREATE TABLE public.alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  type text NOT NULL,
  priority text DEFAULT 'medium'::text,
  title text NOT NULL,
  description text,
  action_url text,
  dismissed boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT alerts_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT alerts_type_check CHECK ((type = ANY (ARRAY['birthday'::text, 'no_contact'::text, 'sentiment_drop'::text, 'opportunity'::text, 'follow_up'::text, 'life_event'::text])))
);

-- ─── public.applied_objection_responses ───
CREATE TABLE public.applied_objection_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  objection text NOT NULL,
  category text,
  response_text text,
  interaction_id uuid,
  note text,
  applied_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT applied_objection_responses_pkey PRIMARY KEY (id)
);

-- ─── public.attribution_models_cache ───
CREATE TABLE public.attribution_models_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  deal_id text NOT NULL,
  model text NOT NULL,
  allocations jsonb DEFAULT '[]'::jsonb NOT NULL,
  total_value numeric DEFAULT 0 NOT NULL,
  computed_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT attribution_models_cache_pkey PRIMARY KEY (id),
  CONSTRAINT attribution_models_cache_user_id_deal_id_model_key UNIQUE (user_id, deal_id, model),
  CONSTRAINT attribution_models_cache_model_check CHECK ((model = ANY (ARRAY['first'::text, 'last'::text, 'linear'::text, 'u_shape'::text, 'w_shape'::text, 'time_decay'::text])))
);

-- ─── public.attribution_touchpoints ───
CREATE TABLE public.attribution_touchpoints (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  deal_id text,
  touchpoint_type text NOT NULL,
  source text,
  medium text,
  campaign text,
  content text,
  term text,
  page_url text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL,
  value_attributed numeric DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT attribution_touchpoints_pkey PRIMARY KEY (id),
  CONSTRAINT attribution_touchpoints_touchpoint_type_check CHECK ((touchpoint_type = ANY (ARRAY['form'::text, 'email'::text, 'page_view'::text, 'magnet'::text, 'sequence'::text, 'call'::text, 'meeting'::text, 'ad'::text, 'social'::text, 'referral'::text, 'other'::text])))
);

-- ─── public.audit_log ───
CREATE TABLE public.audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT audit_log_pkey PRIMARY KEY (id, created_at),
  CONSTRAINT audit_log_action_check CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
) PARTITION BY RANGE (created_at);

-- ─── public.automation_logs ───
CREATE TABLE public.automation_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  trigger_entity_type text NOT NULL,
  trigger_entity_id uuid NOT NULL,
  actions_executed jsonb DEFAULT '[]'::jsonb NOT NULL,
  success boolean DEFAULT true NOT NULL,
  error_message text,
  executed_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT automation_logs_pkey PRIMARY KEY (id)
);

-- ─── public.automation_rules ───
CREATE TABLE public.automation_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb DEFAULT '{}'::jsonb NOT NULL,
  conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
  actions jsonb DEFAULT '[]'::jsonb NOT NULL,
  execution_count integer DEFAULT 0 NOT NULL,
  last_executed_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT automation_rules_pkey PRIMARY KEY (id)
);

-- ─── public.battle_cards ───
CREATE TABLE public.battle_cards (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  competitor_name text NOT NULL,
  competitor_logo_url text,
  summary text,
  our_strengths jsonb DEFAULT '[]'::jsonb NOT NULL,
  their_strengths jsonb DEFAULT '[]'::jsonb NOT NULL,
  weaknesses jsonb DEFAULT '[]'::jsonb NOT NULL,
  pricing_comparison text,
  win_themes text[] DEFAULT ARRAY[]::text[] NOT NULL,
  landmines text[] DEFAULT ARRAY[]::text[] NOT NULL,
  proof_points jsonb DEFAULT '[]'::jsonb NOT NULL,
  last_updated_by uuid,
  version integer DEFAULT 1 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT battle_cards_pkey PRIMARY KEY (id)
);

-- ─── public.behavioral_insight_feedback ───
CREATE TABLE public.behavioral_insight_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  insight_kind text NOT NULL,
  insight_label text NOT NULL,
  vote smallint NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT behavioral_insight_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT behavioral_insight_feedback_unique UNIQUE (user_id, contact_id, insight_kind, insight_label),
  CONSTRAINT behavioral_insight_feedback_insight_kind_check CHECK ((insight_kind = ANY (ARRAY['preference'::text, 'hobby'::text, 'tone'::text]))),
  CONSTRAINT behavioral_insight_feedback_insight_label_check CHECK (((char_length(insight_label) >= 1) AND (char_length(insight_label) <= 200))),
  CONSTRAINT behavioral_insight_feedback_note_check CHECK (((note IS NULL) OR (char_length(note) <= 1000))),
  CONSTRAINT behavioral_insight_feedback_vote_check CHECK ((vote = ANY (ARRAY['-1'::integer, 1])))
);

-- ─── public.behavioral_profile_regen_queue ───
CREATE TABLE public.behavioral_profile_regen_queue (
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
  next_run_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  last_processed_at timestamp with time zone,
  trigger_source text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT behavioral_profile_regen_queue_pkey PRIMARY KEY (contact_id)
);

-- ─── public.brain_dominance_analysis ───
CREATE TABLE public.brain_dominance_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  reptilian_score integer DEFAULT 0,
  limbic_score integer DEFAULT 0,
  neocortex_score integer DEFAULT 0,
  dominant_system text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  negotiation_tips jsonb DEFAULT '[]'::jsonb,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brain_dominance_analysis_pkey PRIMARY KEY (id)
);

-- ─── public.call_logs ───
CREATE TABLE public.call_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  direction text,
  status text,
  duration_seconds integer DEFAULT 0,
  audio_url text,
  transcription text,
  sentiment text,
  summary text,
  external_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT call_logs_pkey PRIMARY KEY (id),
  CONSTRAINT call_logs_external_id_key UNIQUE (external_id),
  CONSTRAINT call_logs_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
  CONSTRAINT call_logs_status_check CHECK ((status = ANY (ARRAY['completed'::text, 'missed'::text, 'busy'::text, 'failed'::text, 'no-answer'::text])))
);

-- ─── public.campaign_recipients ───
CREATE TABLE public.campaign_recipients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT campaign_recipients_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_recipients_campaign_id_contact_id_key UNIQUE (campaign_id, contact_id),
  CONSTRAINT campaign_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'unsubscribed'::text])))
);

-- ─── public.canned_responses ───
CREATE TABLE public.canned_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral'::text,
  shortcut text,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT canned_responses_pkey PRIMARY KEY (id)
);

-- ─── public.churn_risk_scores ───
CREATE TABLE public.churn_risk_scores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  risk_level text DEFAULT 'low'::text NOT NULL,
  risk_score integer DEFAULT 0 NOT NULL,
  risk_factors jsonb DEFAULT '[]'::jsonb NOT NULL,
  recommendations text[] DEFAULT '{}'::text[],
  days_since_last_interaction integer,
  sentiment_trend text,
  score_trend text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT churn_risk_scores_pkey PRIMARY KEY (id),
  CONSTRAINT churn_risk_scores_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  CONSTRAINT churn_risk_scores_risk_score_check CHECK (((risk_score >= 0) AND (risk_score <= 100)))
);

-- ─── public.city_whitelist ───
CREATE TABLE public.city_whitelist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  city text NOT NULL,
  state text,
  country_code text DEFAULT 'BR'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT city_whitelist_pkey PRIMARY KEY (id)
);

-- ─── public.client_values ───
CREATE TABLE public.client_values (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  category text NOT NULL,
  value_name text NOT NULL,
  importance integer DEFAULT 5,
  detected_phrases text[],
  frequency integer DEFAULT 1,
  last_mentioned timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT client_values_pkey PRIMARY KEY (id),
  CONSTRAINT client_values_user_id_contact_id_category_value_name_key UNIQUE (user_id, contact_id, category, value_name),
  CONSTRAINT client_values_importance_check CHECK (((importance >= 1) AND (importance <= 10)))
);

-- ─── public.coaching_scorecards ───
CREATE TABLE public.coaching_scorecards (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  criteria jsonb DEFAULT '[]'::jsonb NOT NULL,
  active boolean DEFAULT true NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT coaching_scorecards_pkey PRIMARY KEY (id)
);

-- ─── public.cognitive_bias_history ───
CREATE TABLE public.cognitive_bias_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  detected_biases jsonb NOT NULL,
  category_distribution jsonb,
  dominant_biases text[],
  vulnerabilities text[],
  resistances text[],
  sales_strategies jsonb,
  profile_summary text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cognitive_bias_history_pkey PRIMARY KEY (id)
);

-- ─── public.communication_preferences ───
CREATE TABLE public.communication_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  preferred_channel text DEFAULT 'whatsapp'::text NOT NULL,
  preferred_days text[] DEFAULT '{}'::text[],
  preferred_time_start time without time zone,
  preferred_time_end time without time zone,
  contact_frequency text DEFAULT 'weekly'::text,
  avoid_days text[] DEFAULT '{}'::text[],
  notes text,
  response_rate_by_channel jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT communication_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT communication_preferences_user_id_contact_id_key UNIQUE (user_id, contact_id)
);

-- ─── public.companies ───
CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  industry text,
  website text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  logo_url text,
  notes text,
  tags text[] DEFAULT '{}'::text[],
  financial_health text DEFAULT 'unknown'::text,
  employee_count text,
  annual_revenue text,
  competitors text[] DEFAULT '{}'::text[],
  challenges text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
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
  twitter text,
  tiktok text,
  version integer DEFAULT 0 NOT NULL,
  external_id text,
  vak_dominant text,
  motivation_direction text,
  working_style text,
  strategic_roadmap jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_financial_health_check CHECK ((financial_health = ANY (ARRAY['growing'::text, 'stable'::text, 'cutting'::text, 'unknown'::text])))
);

-- ─── public.compatibility_alerts ───
CREATE TABLE public.compatibility_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  compatibility_score integer NOT NULL,
  threshold integer NOT NULL,
  alert_type text DEFAULT 'below_threshold'::text NOT NULL,
  title text NOT NULL,
  description text,
  dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone,
  CONSTRAINT compatibility_alerts_pkey PRIMARY KEY (id)
);

-- ─── public.compatibility_settings ───
CREATE TABLE public.compatibility_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  alert_threshold integer DEFAULT 50 NOT NULL,
  alert_only_important boolean DEFAULT true,
  important_min_relationship_score integer DEFAULT 70,
  email_notifications boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT compatibility_settings_pkey PRIMARY KEY (id),
  CONSTRAINT compatibility_settings_user_id_key UNIQUE (user_id)
);

-- ─── public.competitors ───
CREATE TABLE public.competitors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  website text,
  strengths text[] DEFAULT ARRAY[]::text[],
  weaknesses text[] DEFAULT ARRAY[]::text[],
  typical_price_range text,
  win_rate_against numeric(5,2) DEFAULT 0,
  notes text,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT competitors_pkey PRIMARY KEY (id),
  CONSTRAINT competitors_user_id_name_key UNIQUE (user_id, name)
);

-- ─── public.connection_anomalies ───
CREATE TABLE public.connection_anomalies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  webhook_id uuid,
  connection_id uuid,
  anomaly_type text NOT NULL,
  severity text DEFAULT 'medium'::text NOT NULL,
  explanation text NOT NULL,
  metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
  window_start timestamp with time zone NOT NULL,
  window_end timestamp with time zone NOT NULL,
  detected_at timestamp with time zone DEFAULT now() NOT NULL,
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  model_used text,
  confidence numeric(4,3),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT connection_anomalies_pkey PRIMARY KEY (id),
  CONSTRAINT connection_anomalies_anomaly_type_check CHECK ((anomaly_type = ANY (ARRAY['error_spike'::text, 'latency_degradation'::text, 'suspicious_window'::text, 'volume_drop'::text, 'volume_spike'::text, 'schema_drift'::text]))),
  CONSTRAINT connection_anomalies_confidence_check CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))),
  CONSTRAINT connection_anomalies_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);

-- ─── public.connection_configs ───
CREATE TABLE public.connection_configs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  connection_type text NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  secret_refs jsonb DEFAULT '{}'::jsonb NOT NULL,
  last_tested_at timestamp with time zone,
  last_test_status text,
  last_test_latency_ms integer,
  last_test_message text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  encrypted_config bytea,
  encryption_version smallint DEFAULT 1 NOT NULL,
  discovered_schema jsonb,
  discovered_at timestamp with time zone,
  CONSTRAINT connection_configs_pkey PRIMARY KEY (id),
  CONSTRAINT connection_configs_connection_type_check CHECK ((connection_type = ANY (ARRAY['supabase_external'::text, 'bitrix24'::text, 'n8n'::text, 'mcp_claude'::text, 'custom'::text])))
);

-- ─── public.connection_quotas ───
CREATE TABLE public.connection_quotas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  webhook_id uuid NOT NULL,
  period_start date DEFAULT (date_trunc('month'::text, now()))::date NOT NULL,
  calls_limit integer DEFAULT 10000 NOT NULL,
  calls_used integer DEFAULT 0 NOT NULL,
  overage_blocked boolean DEFAULT true NOT NULL,
  alert_sent_80 boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT connection_quotas_pkey PRIMARY KEY (id),
  CONSTRAINT connection_quotas_webhook_id_period_start_key UNIQUE (webhook_id, period_start)
);

-- ─── public.connection_test_logs ───
CREATE TABLE public.connection_test_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  connection_id uuid NOT NULL,
  status text NOT NULL,
  latency_ms integer,
  message text,
  details jsonb,
  tested_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT connection_test_logs_pkey PRIMARY KEY (id)
);

-- ─── public.contact_analytical_profile_versions ───
CREATE TABLE public.contact_analytical_profile_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  profile_id uuid,
  summary text,
  tone text,
  communication_style text,
  sentiment_trend text,
  preferences jsonb DEFAULT '[]'::jsonb NOT NULL,
  hobbies jsonb DEFAULT '[]'::jsonb NOT NULL,
  recurrent_topics jsonb DEFAULT '[]'::jsonb NOT NULL,
  based_on_count integer DEFAULT 0 NOT NULL,
  model text,
  trigger_source text,
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_analytical_profile_versions_pkey PRIMARY KEY (id)
);

-- ─── public.contact_analytical_profiles ───
CREATE TABLE public.contact_analytical_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  user_id uuid,
  preferences jsonb DEFAULT '[]'::jsonb,
  recurrent_topics jsonb DEFAULT '[]'::jsonb,
  communication_style text,
  sentiment_trend text,
  last_updated_at timestamp with time zone DEFAULT now(),
  hobbies jsonb DEFAULT '[]'::jsonb NOT NULL,
  tone text,
  summary text,
  based_on_count integer DEFAULT 0 NOT NULL,
  model text,
  CONSTRAINT contact_analytical_profiles_pkey PRIMARY KEY (id)
);

-- ─── public.contact_automation_settings ───
CREATE TABLE public.contact_automation_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  reminder_enabled boolean DEFAULT true,
  escalation_enabled boolean DEFAULT false,
  delay_hours integer DEFAULT 24,
  escalation_role text DEFAULT 'supervisor'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_escalation_at timestamp with time zone,
  resolution_summary text,
  CONSTRAINT contact_automation_settings_pkey PRIMARY KEY (id),
  CONSTRAINT contact_automation_settings_contact_id_key UNIQUE (contact_id)
);

-- ─── public.contact_behavior ───
CREATE TABLE public.contact_behavior (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  disc_primary text,
  disc_confidence integer,
  disc_notes text,
  vak_primary text,
  motivation_primary text,
  main_fear text,
  career_stage text,
  current_pressure text,
  professional_goals text,
  preferred_channel text,
  message_style text,
  response_time_avg interval,
  best_contact_window text,
  formality_level integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  vak_visual integer DEFAULT 0,
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
  influencer_ids uuid[],
  company_financial_health text,
  current_challenges text[],
  current_competitors text[],
  best_time_to_approach text,
  seasonal_notes text,
  CONSTRAINT contact_behavior_pkey PRIMARY KEY (id),
  CONSTRAINT contact_behavior_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_behavior_decision_power_check CHECK (((decision_power >= 1) AND (decision_power <= 10))),
  CONSTRAINT contact_behavior_disc_confidence_check CHECK (((disc_confidence >= 0) AND (disc_confidence <= 100))),
  CONSTRAINT contact_behavior_disc_primary_check CHECK ((disc_primary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  CONSTRAINT contact_behavior_formality_level_check CHECK (((formality_level >= 1) AND (formality_level <= 5))),
  CONSTRAINT contact_behavior_support_level_check CHECK (((support_level >= 1) AND (support_level <= 10))),
  CONSTRAINT contact_behavior_vak_primary_check CHECK ((vak_primary = ANY (ARRAY['visual'::text, 'auditivo'::text, 'cinestesico'::text]))),
  CONSTRAINT disc_confidence_range CHECK (((disc_confidence >= 0) AND (disc_confidence <= 100))),
  CONSTRAINT formality_level_range CHECK (((formality_level >= 1) AND (formality_level <= 5)))
);

-- ─── public.contact_business_context ───
CREATE TABLE public.contact_business_context (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  financial_health text,
  current_challenges text[],
  competitors_used text[],
  best_moment_to_approach text,
  seasonal_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_business_context_pkey PRIMARY KEY (id),
  CONSTRAINT contact_business_context_contact_id_key UNIQUE (contact_id)
);

-- ─── public.contact_cadence ───
CREATE TABLE public.contact_cadence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  cadence_days integer DEFAULT 14 NOT NULL,
  priority character varying(20) DEFAULT 'medium'::character varying,
  auto_remind boolean DEFAULT true,
  last_contact_at timestamp with time zone,
  next_contact_due timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_cadence_pkey PRIMARY KEY (id),
  CONSTRAINT contact_cadence_user_id_contact_id_key UNIQUE (user_id, contact_id)
);

-- ─── public.contact_cadence_audit ───
CREATE TABLE public.contact_cadence_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cadence_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_cadence_audit_pkey PRIMARY KEY (id)
);

-- ─── public.contact_decision_making ───
CREATE TABLE public.contact_decision_making (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  decision_speed text,
  decision_criteria text[],
  needs_approval boolean DEFAULT false,
  approver_id uuid,
  budget_authority text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_decision_making_pkey PRIMARY KEY (id),
  CONSTRAINT contact_decision_making_contact_id_key UNIQUE (contact_id)
);

-- ─── public.contact_family_history ───
CREATE TABLE public.contact_family_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  family_info text,
  changed_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_family_history_pkey PRIMARY KEY (id)
);

-- ─── public.contact_influence ───
CREATE TABLE public.contact_influence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  decision_role text,
  decision_power integer,
  support_level integer,
  influencer_ids uuid[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_influence_pkey PRIMARY KEY (id),
  CONSTRAINT contact_influence_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_influence_decision_power_check CHECK (((decision_power >= 1) AND (decision_power <= 10))),
  CONSTRAINT contact_influence_support_level_check CHECK (((support_level >= 1) AND (support_level <= 10))),
  CONSTRAINT decision_power_range CHECK (((decision_power >= 1) AND (decision_power <= 10))),
  CONSTRAINT support_level_range CHECK (((support_level >= 1) AND (support_level <= 10)))
);

-- ─── public.contact_metaprograms ───
CREATE TABLE public.contact_metaprograms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  toward_score integer,
  away_from_score integer,
  internal_score integer,
  external_score integer,
  options_score integer,
  procedures_score integer,
  proactive_score integer,
  reactive_score integer,
  global_score integer,
  detail_score integer,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
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
  CONSTRAINT contact_metaprograms_toward_score_check CHECK (((toward_score >= 0) AND (toward_score <= 100)))
);

-- ─── public.contact_next_actions ───
CREATE TABLE public.contact_next_actions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  action text NOT NULL,
  reason text NOT NULL,
  channel text NOT NULL,
  urgency text DEFAULT 'medium'::text NOT NULL,
  suggested_script text,
  expected_outcome text,
  signals_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  model text,
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  suggested_date timestamp with time zone,
  script_context jsonb,
  status text DEFAULT 'pending'::text,
  completed_at timestamp with time zone,
  completion_notes text,
  edited_script text,
  contextual_tone text,
  completion_date timestamp with time zone,
  was_successful boolean DEFAULT true,
  CONSTRAINT contact_next_actions_pkey PRIMARY KEY (id),
  CONSTRAINT contact_next_actions_user_id_contact_id_key UNIQUE (user_id, contact_id),
  CONSTRAINT contact_next_actions_urgency_check CHECK ((urgency = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);

-- ─── public.contact_objection_scripts ───
CREATE TABLE public.contact_objection_scripts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  objection_type text NOT NULL,
  script_content text NOT NULL,
  neurological_bias text,
  effectiveness_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_objection_scripts_pkey PRIMARY KEY (id)
);

-- ─── public.contact_personality ───
CREATE TABLE public.contact_personality (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  big_five_openness integer,
  big_five_conscientiousness integer,
  big_five_extraversion integer,
  big_five_agreeableness integer,
  big_five_neuroticism integer,
  big_five_confidence integer,
  mbti_type text,
  mbti_e_i_score integer,
  mbti_s_n_score integer,
  mbti_t_f_score integer,
  mbti_j_p_score integer,
  enneagram_type integer,
  enneagram_wing integer,
  enneagram_scores jsonb,
  temperament_primary text,
  temperament_secondary text,
  temperament_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
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
  CONSTRAINT contact_personality_mbti_type_check CHECK ((mbti_type ~ '^[E|I][S|N][T|F][J|P]$'::text))
);

-- ─── public.contact_predictive_roadmap ───
CREATE TABLE public.contact_predictive_roadmap (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  forecast_month date NOT NULL,
  predicted_need text NOT NULL,
  probability integer,
  suggested_offering text,
  rationale text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_predictive_roadmap_pkey PRIMARY KEY (id),
  CONSTRAINT contact_predictive_roadmap_probability_check CHECK (((probability >= 0) AND (probability <= 100)))
);

-- ─── public.contact_preferences ───
CREATE TABLE public.contact_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  preferred_channel character varying(50) DEFAULT 'whatsapp'::character varying,
  preferred_days text[] DEFAULT '{}'::text[],
  preferred_times text[] DEFAULT '{}'::text[],
  avoid_days text[] DEFAULT '{}'::text[],
  avoid_times text[] DEFAULT '{}'::text[],
  restrictions text,
  personal_notes text,
  communication_tips text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT contact_preferences_user_id_contact_id_key UNIQUE (user_id, contact_id)
);

-- ─── public.contact_preferences_audit ───
CREATE TABLE public.contact_preferences_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  preference_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_preferences_audit_pkey PRIMARY KEY (id)
);

-- ─── public.contact_rapport_strategy ───
CREATE TABLE public.contact_rapport_strategy (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  visual_preference_score integer,
  auditory_preference_score integer,
  kinesthetic_preference_score integer,
  digital_preference_score integer,
  emotional_anchors text[],
  resistance_triggers text[],
  pacing_speed text,
  voice_tone_preferred text,
  mirroring_technique text,
  preferred_triggers text[],
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_rapport_strategy_pkey PRIMARY KEY (id),
  CONSTRAINT contact_rapport_strategy_contact_id_key UNIQUE (contact_id),
  CONSTRAINT contact_rapport_strategy_auditory_preference_score_check CHECK (((auditory_preference_score >= 0) AND (auditory_preference_score <= 100))),
  CONSTRAINT contact_rapport_strategy_digital_preference_score_check CHECK (((digital_preference_score >= 0) AND (digital_preference_score <= 100))),
  CONSTRAINT contact_rapport_strategy_kinesthetic_preference_score_check CHECK (((kinesthetic_preference_score >= 0) AND (kinesthetic_preference_score <= 100))),
  CONSTRAINT contact_rapport_strategy_pacing_speed_check CHECK ((pacing_speed = ANY (ARRAY['slow'::text, 'medium'::text, 'fast'::text]))),
  CONSTRAINT contact_rapport_strategy_visual_preference_score_check CHECK (((visual_preference_score >= 0) AND (visual_preference_score <= 100)))
);

-- ─── public.contact_relatives ───
CREATE TABLE public.contact_relatives (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  name text NOT NULL,
  relationship_type text NOT NULL,
  age integer,
  birthday date,
  phone text,
  email text,
  occupation text,
  company text,
  notes text,
  is_decision_influencer boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_relatives_pkey PRIMARY KEY (id)
);

-- ─── public.contact_relatives_audit ───
CREATE TABLE public.contact_relatives_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  relative_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  change_type text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamp with time zone DEFAULT now() NOT NULL,
  reason text,
  CONSTRAINT contact_relatives_audit_pkey PRIMARY KEY (id)
);

-- ─── public.contact_report_overrides ───
CREATE TABLE public.contact_report_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  insights_data jsonb DEFAULT '{}'::jsonb,
  custom_scripts jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT contact_report_overrides_pkey PRIMARY KEY (id),
  CONSTRAINT contact_report_overrides_contact_id_key UNIQUE (contact_id)
);

-- ─── public.contact_time_analysis ───
CREATE TABLE public.contact_time_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  hour_of_day integer NOT NULL,
  success_count integer DEFAULT 0,
  total_attempts integer DEFAULT 0,
  avg_response_time_minutes integer,
  last_updated timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_time_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key UNIQUE (user_id, contact_id, day_of_week, hour_of_day)
);

-- ─── public.contact_time_analysis_audit ───
CREATE TABLE public.contact_time_analysis_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  analysis_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_time_analysis_audit_pkey PRIMARY KEY (id)
);

-- ─── public.contacts ───
CREATE TABLE public.contacts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text DEFAULT 'contact'::text,
  role_title text,
  email text,
  phone text,
  whatsapp text,
  linkedin text,
  instagram text,
  twitter text,
  avatar_url text,
  birthday date,
  notes text,
  tags text[] DEFAULT '{}'::text[],
  hobbies text[] DEFAULT '{}'::text[],
  interests text[] DEFAULT '{}'::text[],
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
  comparison_style text,
  most_frequent_objection text,
  vak_profile jsonb DEFAULT '{}'::jsonb,
  metaprogram_profile jsonb DEFAULT '{}'::jsonb,
  objection_patterns jsonb DEFAULT '[]'::jsonb,
  predictive_roadmap jsonb DEFAULT '[]'::jsonb,
  future_needs_forecast jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_relationship_score_check CHECK (((relationship_score >= 0) AND (relationship_score <= 100))),
  CONSTRAINT contacts_relationship_stage_check CHECK ((relationship_stage = ANY (ARRAY['unknown'::text, 'prospect'::text, 'qualified_lead'::text, 'opportunity'::text, 'negotiation'::text, 'customer'::text, 'loyal_customer'::text, 'advocate'::text, 'at_risk'::text, 'lost'::text]))),
  CONSTRAINT contacts_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'manager'::text, 'buyer'::text, 'contact'::text, 'decision_maker'::text, 'influencer'::text]))),
  CONSTRAINT contacts_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])))
);

-- ─── public.conversation_analyses ───
CREATE TABLE public.conversation_analyses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  interaction_id uuid NOT NULL,
  contact_id uuid,
  deal_id uuid,
  duration_seconds integer,
  talk_ratio_rep numeric(5,2),
  talk_ratio_customer numeric(5,2),
  longest_monologue_seconds integer,
  questions_asked integer DEFAULT 0,
  sentiment_overall text,
  sentiment_timeline jsonb DEFAULT '[]'::jsonb NOT NULL,
  topics jsonb DEFAULT '[]'::jsonb NOT NULL,
  objections jsonb DEFAULT '[]'::jsonb NOT NULL,
  action_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  key_moments jsonb DEFAULT '[]'::jsonb NOT NULL,
  coaching_score integer,
  coaching_tips text[] DEFAULT '{}'::text[] NOT NULL,
  next_best_action text,
  model_used text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT conversation_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_analyses_user_id_interaction_id_key UNIQUE (user_id, interaction_id),
  CONSTRAINT conversation_analyses_coaching_score_check CHECK (((coaching_score >= 0) AND (coaching_score <= 100))),
  CONSTRAINT conversation_analyses_sentiment_overall_check CHECK ((sentiment_overall = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'mixed'::text])))
);

-- ─── public.conversation_topics_catalog ───
CREATE TABLE public.conversation_topics_catalog (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  topic_key text NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  keywords text[] DEFAULT '{}'::text[] NOT NULL,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT conversation_topics_catalog_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_topics_catalog_user_id_topic_key_key UNIQUE (user_id, topic_key),
  CONSTRAINT conversation_topics_catalog_category_check CHECK ((category = ANY (ARRAY['product'::text, 'pricing'::text, 'competition'::text, 'objection'::text, 'closing'::text, 'discovery'::text, 'other'::text])))
);

-- ─── public.conversational_search_cache ───
CREATE TABLE public.conversational_search_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  query_hash text NOT NULL,
  query_text text NOT NULL,
  response jsonb NOT NULL,
  model text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval) NOT NULL,
  CONSTRAINT conversational_search_cache_pkey PRIMARY KEY (id),
  CONSTRAINT conversational_search_cache_user_id_query_hash_key UNIQUE (user_id, query_hash)
);

-- ─── public.crm_alerts ───
CREATE TABLE public.crm_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  type text NOT NULL,
  severity text DEFAULT 'medium'::text,
  message text NOT NULL,
  suggested_action text,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT crm_alerts_pkey PRIMARY KEY (id)
);

-- ─── public.crm_automation_logs ───
CREATE TABLE public.crm_automation_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  automation_name text NOT NULL,
  status text NOT NULL,
  payload jsonb,
  result jsonb,
  execution_time_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  audit_context jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT crm_automation_logs_pkey PRIMARY KEY (id)
);

-- ─── public.crm_automation_reprocess_queue ───
CREATE TABLE public.crm_automation_reprocess_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  log_id uuid,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'::text,
  last_error text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_automation_reprocess_queue_pkey PRIMARY KEY (id)
);

-- ─── public.crm_cadence_rules ───
CREATE TABLE public.crm_cadence_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  relationship_stage text NOT NULL,
  frequency_days integer NOT NULL,
  priority text DEFAULT 'medium'::text,
  suggested_actions text[],
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  cadence_steps jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT crm_cadence_rules_pkey PRIMARY KEY (id),
  CONSTRAINT crm_cadence_rules_user_id_relationship_stage_version_key UNIQUE (user_id, relationship_stage, version)
);

-- ─── public.crm_consent_audit_logs ───
CREATE TABLE public.crm_consent_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  consent_type text NOT NULL,
  status text NOT NULL,
  source text NOT NULL,
  ip_address text,
  platform text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT crm_consent_audit_logs_pkey PRIMARY KEY (id)
);

-- ─── public.crm_metric_overrides ───
CREATE TABLE public.crm_metric_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  metric_type text NOT NULL,
  old_value text,
  new_value text NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_metric_overrides_pkey PRIMARY KEY (id)
);

-- ─── public.crm_objection_intelligence ───
CREATE TABLE public.crm_objection_intelligence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  objection_type text NOT NULL,
  behavioral_profile text,
  suggested_strategy text,
  script_content text,
  success_rate numeric(5,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_objection_intelligence_pkey PRIMARY KEY (id)
);

-- ─── public.crm_relationship_audit_logs ───
CREATE TABLE public.crm_relationship_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  change_source text NOT NULL,
  trigger_name text,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT crm_relationship_audit_logs_pkey PRIMARY KEY (id)
);

-- ─── public.cron_secrets ───
CREATE TABLE public.cron_secrets (
  name text NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cron_secrets_pkey PRIMARY KEY (name)
);

-- ─── public.cs_accounts ───
CREATE TABLE public.cs_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  csm_owner_id uuid,
  account_name text NOT NULL,
  tier text DEFAULT 'mid'::text NOT NULL,
  arr numeric DEFAULT 0 NOT NULL,
  contract_start date,
  renewal_date date,
  lifecycle_stage text DEFAULT 'onboarding'::text NOT NULL,
  health_score integer DEFAULT 50 NOT NULL,
  health_trend text DEFAULT 'stable'::text,
  notes text,
  last_health_recalc_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cs_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT cs_accounts_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100))),
  CONSTRAINT cs_accounts_health_trend_check CHECK ((health_trend = ANY (ARRAY['up'::text, 'stable'::text, 'down'::text]))),
  CONSTRAINT cs_accounts_lifecycle_stage_check CHECK ((lifecycle_stage = ANY (ARRAY['onboarding'::text, 'adopting'::text, 'mature'::text, 'at_risk'::text, 'churned'::text]))),
  CONSTRAINT cs_accounts_tier_check CHECK ((tier = ANY (ARRAY['strategic'::text, 'enterprise'::text, 'mid'::text, 'smb'::text])))
);

-- ─── public.cs_health_signals ───
CREATE TABLE public.cs_health_signals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  signal_type text NOT NULL,
  score numeric DEFAULT 0 NOT NULL,
  weight numeric DEFAULT 1 NOT NULL,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  captured_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cs_health_signals_pkey PRIMARY KEY (id),
  CONSTRAINT cs_health_signals_signal_type_check CHECK ((signal_type = ANY (ARRAY['usage'::text, 'support'::text, 'engagement'::text, 'sentiment'::text, 'payment'::text, 'nps'::text])))
);

-- ─── public.cs_nps_responses ───
CREATE TABLE public.cs_nps_responses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  contact_id uuid,
  score integer NOT NULL,
  category text NOT NULL,
  comment text,
  surveyed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cs_nps_responses_pkey PRIMARY KEY (id),
  CONSTRAINT cs_nps_responses_category_check CHECK ((category = ANY (ARRAY['promoter'::text, 'passive'::text, 'detractor'::text]))),
  CONSTRAINT cs_nps_responses_score_check CHECK (((score >= 0) AND (score <= 10)))
);

-- ─── public.cs_qbrs ───
CREATE TABLE public.cs_qbrs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  title text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  status text DEFAULT 'scheduled'::text NOT NULL,
  agenda jsonb DEFAULT '[]'::jsonb NOT NULL,
  outcomes jsonb DEFAULT '[]'::jsonb NOT NULL,
  next_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
  attendees jsonb DEFAULT '[]'::jsonb NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cs_qbrs_pkey PRIMARY KEY (id),
  CONSTRAINT cs_qbrs_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))
);

-- ─── public.cs_renewals ───
CREATE TABLE public.cs_renewals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  renewal_date date NOT NULL,
  status text DEFAULT 'upcoming'::text NOT NULL,
  forecasted_arr numeric DEFAULT 0 NOT NULL,
  actual_arr numeric,
  risk_level text DEFAULT 'low'::text NOT NULL,
  notes text,
  closed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cs_renewals_pkey PRIMARY KEY (id),
  CONSTRAINT cs_renewals_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  CONSTRAINT cs_renewals_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'in_negotiation'::text, 'renewed'::text, 'churned'::text, 'downgraded'::text, 'expanded'::text])))
);

-- ─── public.csat_surveys ───
CREATE TABLE public.csat_surveys (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  ticket_id uuid,
  score integer,
  feedback text,
  channel text DEFAULT 'email'::text,
  status text DEFAULT 'pending'::text NOT NULL,
  sent_at timestamp with time zone,
  answered_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  public_token uuid DEFAULT gen_random_uuid() NOT NULL,
  CONSTRAINT csat_surveys_pkey PRIMARY KEY (id),
  CONSTRAINT csat_surveys_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text, 'in_app'::text, 'sms'::text]))),
  CONSTRAINT csat_surveys_score_check CHECK (((score >= 1) AND (score <= 5))),
  CONSTRAINT csat_surveys_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'answered'::text, 'expired'::text])))
);

-- ─── public.custom_field_values ───
CREATE TABLE public.custom_field_values (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  custom_field_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  value text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT custom_field_values_pkey PRIMARY KEY (id),
  CONSTRAINT custom_field_values_custom_field_id_entity_id_key UNIQUE (custom_field_id, entity_id)
);

-- ─── public.custom_fields ───
CREATE TABLE public.custom_fields (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  field_options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT custom_fields_pkey PRIMARY KEY (id),
  CONSTRAINT custom_fields_user_id_entity_type_field_name_key UNIQUE (user_id, entity_type, field_name),
  CONSTRAINT custom_fields_entity_type_check CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text, 'deal'::text]))),
  CONSTRAINT custom_fields_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'number'::text, 'date'::text, 'select'::text, 'boolean'::text, 'url'::text, 'email'::text, 'phone'::text])))
);

-- ─── public.deal_forecasts ───
CREATE TABLE public.deal_forecasts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  deal_id text NOT NULL,
  deal_name text,
  contact_id uuid,
  company_id uuid,
  period_id uuid NOT NULL,
  category text DEFAULT 'pipeline'::text NOT NULL,
  confidence_score integer DEFAULT 50 NOT NULL,
  forecasted_amount numeric DEFAULT 0 NOT NULL,
  forecasted_close_date date,
  stage text,
  risk_factors jsonb DEFAULT '[]'::jsonb NOT NULL,
  health_score integer DEFAULT 50 NOT NULL,
  last_activity_at timestamp with time zone,
  slip_count integer DEFAULT 0 NOT NULL,
  ai_rationale text,
  notes text,
  analyzed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deal_forecasts_pkey PRIMARY KEY (id),
  CONSTRAINT deal_forecasts_deal_id_period_id_key UNIQUE (deal_id, period_id),
  CONSTRAINT deal_forecasts_category_check CHECK ((category = ANY (ARRAY['commit'::text, 'best_case'::text, 'pipeline'::text, 'omitted'::text]))),
  CONSTRAINT deal_forecasts_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100))),
  CONSTRAINT deal_forecasts_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100)))
);

-- ─── public.deal_room_activities ───
CREATE TABLE public.deal_room_activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  actor_side text NOT NULL,
  actor_label text,
  activity_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deal_room_activities_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_activities_actor_side_check CHECK ((actor_side = ANY (ARRAY['seller'::text, 'buyer'::text, 'system'::text])))
);

-- ─── public.deal_room_comments ───
CREATE TABLE public.deal_room_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  author_side text NOT NULL,
  author_label text,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deal_room_comments_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_comments_author_side_check CHECK ((author_side = ANY (ARRAY['seller'::text, 'buyer'::text])))
);

-- ─── public.deal_room_documents ───
CREATE TABLE public.deal_room_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by_side text DEFAULT 'seller'::text NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deal_room_documents_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_documents_uploaded_by_side_check CHECK ((uploaded_by_side = ANY (ARRAY['seller'::text, 'buyer'::text])))
);

-- ─── public.deal_room_milestones ───
CREATE TABLE public.deal_room_milestones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status text DEFAULT 'pending'::text NOT NULL,
  owner_side text DEFAULT 'both'::text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  completed_at timestamp with time zone,
  completed_by_side text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deal_room_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_milestones_completed_by_side_check CHECK ((completed_by_side = ANY (ARRAY['seller'::text, 'buyer'::text]))),
  CONSTRAINT deal_room_milestones_owner_side_check CHECK ((owner_side = ANY (ARRAY['seller'::text, 'buyer'::text, 'both'::text]))),
  CONSTRAINT deal_room_milestones_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'done'::text, 'blocked'::text])))
);

-- ─── public.deal_room_stakeholders ───
CREATE TABLE public.deal_room_stakeholders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  name text NOT NULL,
  email text,
  role_title text,
  side text NOT NULL,
  influence text DEFAULT 'user'::text NOT NULL,
  engagement_score integer DEFAULT 50 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deal_room_stakeholders_pkey PRIMARY KEY (id),
  CONSTRAINT deal_room_stakeholders_engagement_score_check CHECK (((engagement_score >= 0) AND (engagement_score <= 100))),
  CONSTRAINT deal_room_stakeholders_influence_check CHECK ((influence = ANY (ARRAY['champion'::text, 'decision_maker'::text, 'influencer'::text, 'blocker'::text, 'user'::text]))),
  CONSTRAINT deal_room_stakeholders_side_check CHECK ((side = ANY (ARRAY['seller'::text, 'buyer'::text])))
);

-- ─── public.deal_rooms ───
CREATE TABLE public.deal_rooms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  deal_id text,
  deal_name text,
  company_id uuid,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active'::text NOT NULL,
  deal_value numeric,
  target_close_date date,
  share_token text DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text) NOT NULL,
  share_enabled boolean DEFAULT false NOT NULL,
  last_buyer_view_at timestamp with time zone,
  buyer_view_count integer DEFAULT 0 NOT NULL,
  health_score integer,
  health_recommendations jsonb DEFAULT '[]'::jsonb NOT NULL,
  health_analyzed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deal_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT deal_rooms_share_token_key UNIQUE (share_token),
  CONSTRAINT deal_rooms_status_check CHECK ((status = ANY (ARRAY['active'::text, 'won'::text, 'lost'::text, 'paused'::text])))
);

-- ─── public.deals ───
CREATE TABLE public.deals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  pipeline_id uuid,
  stage_id uuid,
  title text NOT NULL,
  value numeric(15,2) DEFAULT 0,
  probability integer DEFAULT 10,
  expected_closing_date date,
  status text DEFAULT 'open'::text NOT NULL,
  loss_reason text,
  notes text,
  priority text DEFAULT 'medium'::text,
  tags text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT deals_pkey PRIMARY KEY (id),
  CONSTRAINT deals_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
  CONSTRAINT deals_status_check CHECK ((status = ANY (ARRAY['open'::text, 'won'::text, 'lost'::text, 'on_hold'::text])))
);

-- ─── public.decision_criteria ───
CREATE TABLE public.decision_criteria (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  name text NOT NULL,
  priority integer DEFAULT 1,
  criteria_type text NOT NULL,
  detected_from text,
  how_to_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT decision_criteria_pkey PRIMARY KEY (id),
  CONSTRAINT decision_criteria_criteria_type_check CHECK ((criteria_type = ANY (ARRAY['must_have'::text, 'nice_to_have'::text, 'deal_breaker'::text])))
);

-- ─── public.device_login_notifications ───
CREATE TABLE public.device_login_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  device_id uuid,
  ip_address text,
  location text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT device_login_notifications_pkey PRIMARY KEY (id)
);

-- ─── public.disc_analysis_history ───
CREATE TABLE public.disc_analysis_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  dominance_score integer DEFAULT 0 NOT NULL,
  influence_score integer DEFAULT 0 NOT NULL,
  steadiness_score integer DEFAULT 0 NOT NULL,
  conscientiousness_score integer DEFAULT 0 NOT NULL,
  primary_profile text NOT NULL,
  secondary_profile text,
  blend_profile text,
  stress_primary text,
  stress_secondary text,
  confidence integer DEFAULT 50 NOT NULL,
  analysis_source text DEFAULT 'manual'::text NOT NULL,
  detected_keywords jsonb DEFAULT '[]'::jsonb,
  detected_phrases jsonb DEFAULT '[]'::jsonb,
  behavior_indicators jsonb DEFAULT '[]'::jsonb,
  analyzed_text text,
  analysis_notes text,
  profile_summary text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
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
  CONSTRAINT disc_analysis_history_stress_secondary_check CHECK ((stress_secondary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text])))
);

-- ─── public.disc_analysis_history_audit ───
CREATE TABLE public.disc_analysis_history_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  analysis_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT disc_analysis_history_audit_pkey PRIMARY KEY (id)
);

-- ─── public.disc_communication_logs ───
CREATE TABLE public.disc_communication_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  contact_disc_profile text NOT NULL,
  approach_adapted boolean DEFAULT false NOT NULL,
  adaptation_tips_shown jsonb DEFAULT '[]'::jsonb,
  tips_followed jsonb DEFAULT '[]'::jsonb,
  communication_outcome text,
  outcome_notes text,
  effectiveness_rating integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT disc_communication_logs_pkey PRIMARY KEY (id),
  CONSTRAINT disc_communication_logs_communication_outcome_check CHECK ((communication_outcome = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))),
  CONSTRAINT disc_communication_logs_contact_disc_profile_check CHECK ((contact_disc_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
  CONSTRAINT disc_communication_logs_effectiveness_rating_check CHECK (((effectiveness_rating >= 1) AND (effectiveness_rating <= 5)))
);

-- ─── public.disc_conversion_metrics ───
CREATE TABLE public.disc_conversion_metrics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  disc_profile text NOT NULL,
  blend_profile text,
  total_contacts integer DEFAULT 0 NOT NULL,
  total_opportunities integer DEFAULT 0 NOT NULL,
  converted_count integer DEFAULT 0 NOT NULL,
  lost_count integer DEFAULT 0 NOT NULL,
  conversion_rate numeric(5,2),
  average_deal_size numeric,
  average_sales_cycle_days integer,
  average_relationship_score numeric(5,2),
  average_compatibility_score numeric(5,2),
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT disc_conversion_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT disc_conversion_metrics_user_id_disc_profile_period_start_p_key UNIQUE (user_id, disc_profile, period_start, period_end),
  CONSTRAINT disc_conversion_metrics_disc_profile_check CHECK ((disc_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text])))
);

-- ─── public.disc_profile_config ───
CREATE TABLE public.disc_profile_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  profile_type text NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  detailed_description text NOT NULL,
  core_drive text NOT NULL,
  core_fear text NOT NULL,
  under_pressure text NOT NULL,
  ideal_environment text NOT NULL,
  communication_style jsonb DEFAULT '{}'::jsonb NOT NULL,
  preferred_pace text NOT NULL,
  decision_making_style text NOT NULL,
  opening_strategies jsonb DEFAULT '[]'::jsonb NOT NULL,
  presentation_tips jsonb DEFAULT '[]'::jsonb NOT NULL,
  objection_handling jsonb DEFAULT '[]'::jsonb NOT NULL,
  closing_techniques jsonb DEFAULT '[]'::jsonb NOT NULL,
  follow_up_approach jsonb DEFAULT '[]'::jsonb NOT NULL,
  power_words jsonb DEFAULT '[]'::jsonb NOT NULL,
  avoid_words jsonb DEFAULT '[]'::jsonb NOT NULL,
  detection_keywords jsonb DEFAULT '[]'::jsonb NOT NULL,
  typical_phrases jsonb DEFAULT '[]'::jsonb NOT NULL,
  compatibility_matrix jsonb DEFAULT '{}'::jsonb NOT NULL,
  color_scheme jsonb DEFAULT '{}'::jsonb NOT NULL,
  icon text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT disc_profile_config_pkey PRIMARY KEY (id),
  CONSTRAINT disc_profile_config_profile_type_key UNIQUE (profile_type),
  CONSTRAINT disc_profile_config_profile_type_check CHECK ((profile_type = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text, 'DI'::text, 'DC'::text, 'ID'::text, 'IS'::text, 'SI'::text, 'SC'::text, 'CS'::text, 'CD'::text])))
);

-- ─── public.document_signatures ───
CREATE TABLE public.document_signatures (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  document_id uuid,
  template_id uuid,
  contact_id uuid,
  company_id uuid,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  rendered_html text NOT NULL,
  merge_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  signature_token text DEFAULT encode(extensions.gen_random_bytes(24), 'hex'::text) NOT NULL,
  signature_image text,
  signature_typed text,
  signed_ip text,
  signed_user_agent text,
  viewed_at timestamp with time zone,
  signed_at timestamp with time zone,
  declined_at timestamp with time zone,
  declined_reason text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT document_signatures_pkey PRIMARY KEY (id),
  CONSTRAINT document_signatures_signature_token_key UNIQUE (signature_token)
);

-- ─── public.document_templates ───
CREATE TABLE public.document_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  document_type text DEFAULT 'contract'::text NOT NULL,
  content_html text NOT NULL,
  merge_fields jsonb DEFAULT '[]'::jsonb NOT NULL,
  category text,
  is_active boolean DEFAULT true NOT NULL,
  usage_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT document_templates_pkey PRIMARY KEY (id)
);

-- ─── public.document_views ───
CREATE TABLE public.document_views (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  signature_id uuid,
  document_id uuid,
  viewer_ip text,
  viewer_user_agent text,
  viewer_email text,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT document_views_pkey PRIMARY KEY (id)
);

-- ─── public.documents ───
CREATE TABLE public.documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  document_type text DEFAULT 'other'::text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  version integer DEFAULT 1,
  status text DEFAULT 'active'::text,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_document_type_check CHECK ((document_type = ANY (ARRAY['contract'::text, 'proposal'::text, 'nda'::text, 'invoice'::text, 'report'::text, 'presentation'::text, 'spreadsheet'::text, 'image'::text, 'other'::text]))),
  CONSTRAINT documents_entity_type_check CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text, 'deal'::text]))),
  CONSTRAINT documents_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'draft'::text])))
);

-- ─── public.email_campaigns ───
CREATE TABLE public.email_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  content_html text,
  content_text text,
  status text DEFAULT 'draft'::text NOT NULL,
  segment_filter jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  investment numeric(12,2) DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  CONSTRAINT email_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT email_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'cancelled'::text])))
);

-- ─── public.email_finder_results ───
CREATE TABLE public.email_finder_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  full_name text NOT NULL,
  first_name text,
  last_name text,
  domain text NOT NULL,
  candidates jsonb DEFAULT '[]'::jsonb NOT NULL,
  best_email text,
  best_confidence integer DEFAULT 0 NOT NULL,
  sources jsonb DEFAULT '[]'::jsonb NOT NULL,
  found_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT email_finder_results_pkey PRIMARY KEY (id),
  CONSTRAINT email_finder_results_best_confidence_check CHECK (((best_confidence >= 0) AND (best_confidence <= 100)))
);

-- ─── public.email_thread_summaries ───
CREATE TABLE public.email_thread_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  thread_key text NOT NULL,
  interaction_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  summary text NOT NULL,
  key_points text[] DEFAULT '{}'::text[] NOT NULL,
  action_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  sentiment text,
  next_steps text[] DEFAULT '{}'::text[] NOT NULL,
  generated_by_model text DEFAULT 'google/gemini-2.5-flash'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT email_thread_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT email_thread_summaries_user_id_thread_key_key UNIQUE (user_id, thread_key)
);

-- ─── public.email_verifications ───
CREATE TABLE public.email_verifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  email text NOT NULL,
  status text DEFAULT 'unknown'::text NOT NULL,
  score integer DEFAULT 0 NOT NULL,
  mx_found boolean DEFAULT false NOT NULL,
  smtp_check boolean DEFAULT false NOT NULL,
  disposable boolean DEFAULT false NOT NULL,
  role_account boolean DEFAULT false NOT NULL,
  free_provider boolean DEFAULT false NOT NULL,
  reasons text[] DEFAULT ARRAY[]::text[] NOT NULL,
  provider text DEFAULT 'internal'::text NOT NULL,
  raw jsonb DEFAULT '{}'::jsonb NOT NULL,
  verified_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT email_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT email_verifications_score_check CHECK (((score >= 0) AND (score <= 100))),
  CONSTRAINT email_verifications_status_check CHECK ((status = ANY (ARRAY['valid'::text, 'invalid'::text, 'risky'::text, 'unknown'::text, 'catchall'::text])))
);

-- ─── public.emotional_anchors ───
CREATE TABLE public.emotional_anchors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  anchor_type text NOT NULL,
  trigger_word text NOT NULL,
  emotional_state text NOT NULL,
  context text,
  strength integer DEFAULT 5,
  detected_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT emotional_anchors_pkey PRIMARY KEY (id),
  CONSTRAINT emotional_anchors_anchor_type_check CHECK ((anchor_type = ANY (ARRAY['positive'::text, 'negative'::text]))),
  CONSTRAINT emotional_anchors_strength_check CHECK (((strength >= 1) AND (strength <= 10)))
);

-- ─── public.emotional_states_history ───
CREATE TABLE public.emotional_states_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  emotional_state text NOT NULL,
  confidence integer DEFAULT 50,
  trigger text,
  context text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT emotional_states_history_pkey PRIMARY KEY (id)
);

-- ─── public.entity_relationships ───
CREATE TABLE public.entity_relationships (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  from_type entity_type NOT NULL,
  from_id uuid NOT NULL,
  to_type entity_type NOT NULL,
  to_id uuid NOT NULL,
  role entity_relationship_role NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  started_at date,
  ended_at date,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT entity_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT entity_relationships_unique UNIQUE (from_type, from_id, to_type, to_id, role),
  CONSTRAINT entity_relationships_no_self CHECK ((NOT ((from_type = to_type) AND (from_id = to_id)))),
  CONSTRAINT entity_relationships_period_valid CHECK (((ended_at IS NULL) OR (started_at IS NULL) OR (ended_at >= started_at)))
);

-- ─── public.eq_analysis_history ───
CREATE TABLE public.eq_analysis_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  overall_score integer NOT NULL,
  overall_level text NOT NULL,
  confidence integer,
  pillar_scores jsonb NOT NULL,
  indicators jsonb,
  strengths text[],
  areas_for_growth text[],
  sales_implications jsonb,
  communication_style jsonb,
  profile_summary text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT eq_analysis_history_pkey PRIMARY KEY (id),
  CONSTRAINT eq_analysis_history_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100))),
  CONSTRAINT eq_analysis_history_overall_score_check CHECK (((overall_score >= 0) AND (overall_score <= 100)))
);

-- ─── public.error_logs ───
CREATE TABLE public.error_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  message text NOT NULL,
  stack text,
  context jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  severity error_severity DEFAULT 'error'::error_severity NOT NULL,
  url text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT error_logs_pkey PRIMARY KEY (id)
);

-- ─── public.favorite_templates ───
CREATE TABLE public.favorite_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  template_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT favorite_templates_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_templates_user_id_template_id_key UNIQUE (user_id, template_id)
);

-- ─── public.feature_flags ───
CREATE TABLE public.feature_flags (
  name text NOT NULL,
  enabled boolean DEFAULT false NOT NULL,
  description text,
  roles text[] DEFAULT ARRAY[]::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT feature_flags_pkey PRIMARY KEY (name)
);

-- ─── public.ficha360_conversation_summaries ───
CREATE TABLE public.ficha360_conversation_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  filters_hash text NOT NULL,
  interaction_ids uuid[] NOT NULL,
  filters_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  summary jsonb NOT NULL,
  model text NOT NULL,
  interactions_analyzed integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ficha360_conversation_summaries_pkey PRIMARY KEY (id)
);

-- ─── public.follow_up_approvals ───
CREATE TABLE public.follow_up_approvals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  channel text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  scheduled_for timestamp with time zone,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follow_up_approvals_pkey PRIMARY KEY (id)
);

-- ─── public.follow_up_approvals_v2 ───
CREATE TABLE public.follow_up_approvals_v2 (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id text,
  user_id uuid NOT NULL,
  content text NOT NULL,
  channel text DEFAULT 'whatsapp'::text,
  status text DEFAULT 'pending'::text,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follow_up_approvals_v2_pkey PRIMARY KEY (id)
);

-- ─── public.forecast_categories_history ───
CREATE TABLE public.forecast_categories_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  deal_forecast_id uuid NOT NULL,
  from_category text,
  to_category text NOT NULL,
  changed_by text DEFAULT 'user'::text NOT NULL,
  reason text,
  changed_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT forecast_categories_history_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_categories_history_changed_by_check CHECK ((changed_by = ANY (ARRAY['user'::text, 'ai'::text, 'system'::text])))
);

-- ─── public.forecast_periods ───
CREATE TABLE public.forecast_periods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  period_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  quota_amount numeric DEFAULT 0 NOT NULL,
  actual_won_amount numeric DEFAULT 0 NOT NULL,
  status text DEFAULT 'open'::text NOT NULL,
  closed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT forecast_periods_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_periods_user_id_period_type_period_start_key UNIQUE (user_id, period_type, period_start),
  CONSTRAINT forecast_periods_period_type_check CHECK ((period_type = ANY (ARRAY['month'::text, 'quarter'::text]))),
  CONSTRAINT forecast_periods_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);

-- ─── public.forecast_quota_settings ───
CREATE TABLE public.forecast_quota_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  default_monthly_quota numeric DEFAULT 0 NOT NULL,
  default_quarterly_quota numeric DEFAULT 0 NOT NULL,
  health_weight_activity integer DEFAULT 30 NOT NULL,
  health_weight_stage_age integer DEFAULT 25 NOT NULL,
  health_weight_engagement integer DEFAULT 25 NOT NULL,
  health_weight_relationship integer DEFAULT 20 NOT NULL,
  inactivity_threshold_days integer DEFAULT 14 NOT NULL,
  slip_threshold_days integer DEFAULT 7 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT forecast_quota_settings_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_quota_settings_user_id_key UNIQUE (user_id)
);

-- ─── public.forecast_snapshots ───
CREATE TABLE public.forecast_snapshots (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  period_id uuid NOT NULL,
  snapshot_date date DEFAULT CURRENT_DATE NOT NULL,
  commit_total numeric DEFAULT 0 NOT NULL,
  best_case_total numeric DEFAULT 0 NOT NULL,
  pipeline_total numeric DEFAULT 0 NOT NULL,
  weighted_total numeric DEFAULT 0 NOT NULL,
  deal_count integer DEFAULT 0 NOT NULL,
  snapshot_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT forecast_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_snapshots_period_id_snapshot_date_key UNIQUE (period_id, snapshot_date)
);

-- ─── public.form_submissions ───
CREATE TABLE public.form_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  form_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  routed_to uuid,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  page_url text,
  user_agent text,
  ip_hash text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT form_submissions_pkey PRIMARY KEY (id)
);

-- ─── public.forms ───
CREATE TABLE public.forms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  fields jsonb DEFAULT '[]'::jsonb NOT NULL,
  routing_rules jsonb DEFAULT '{"type": "round_robin", "members": []}'::jsonb NOT NULL,
  nurturing_workflow_id uuid,
  redirect_url text,
  success_message text DEFAULT 'Obrigado! Recebemos seus dados.'::text,
  is_published boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  submission_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT forms_pkey PRIMARY KEY (id),
  CONSTRAINT forms_slug_key UNIQUE (slug)
);

-- ─── public.geo_allowed_countries ───
CREATE TABLE public.geo_allowed_countries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  country_code text NOT NULL,
  country_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT geo_allowed_countries_pkey PRIMARY KEY (id)
);

-- ─── public.handoff_requests ───
CREATE TABLE public.handoff_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  from_member_id uuid NOT NULL,
  to_member_id uuid,
  status text DEFAULT 'pending'::text NOT NULL,
  qualification_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  handoff_reason text,
  notes text,
  rejection_reason text,
  sla_hours integer DEFAULT 4 NOT NULL,
  accepted_at timestamp with time zone,
  rejected_at timestamp with time zone,
  expired_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT handoff_requests_pkey PRIMARY KEY (id),
  CONSTRAINT handoff_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'cancelled'::text])))
);

-- ─── public.health_alert_settings ───
CREATE TABLE public.health_alert_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  critical_threshold integer DEFAULT 30,
  warning_threshold integer DEFAULT 50,
  check_frequency_hours integer DEFAULT 24,
  notify_on_critical boolean DEFAULT true,
  notify_on_warning boolean DEFAULT false,
  email_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT health_alert_settings_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_health_settings UNIQUE (user_id)
);

-- ─── public.health_alerts ───
CREATE TABLE public.health_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  alert_type text DEFAULT 'critical'::text NOT NULL,
  health_score integer NOT NULL,
  previous_score integer,
  title text NOT NULL,
  description text,
  factors jsonb,
  dismissed boolean DEFAULT false,
  notified_via text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT health_alerts_pkey PRIMARY KEY (id)
);

-- ─── public.hidden_objections ───
CREATE TABLE public.hidden_objections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  objection_type text NOT NULL,
  indicator text NOT NULL,
  probability integer DEFAULT 50,
  severity text NOT NULL,
  possible_real_objection text,
  suggested_probe text,
  resolution_templates text[],
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT hidden_objections_pkey PRIMARY KEY (id),
  CONSTRAINT hidden_objections_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
  CONSTRAINT hidden_objections_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);

-- ─── public.incoming_webhook_dlq ───
CREATE TABLE public.incoming_webhook_dlq (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  webhook_id uuid NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  source_ip text,
  user_agent text,
  attempts integer DEFAULT 0 NOT NULL,
  max_attempts integer DEFAULT 5 NOT NULL,
  next_retry_at timestamp with time zone DEFAULT now() NOT NULL,
  last_error text,
  status text DEFAULT 'pending'::text NOT NULL,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT incoming_webhook_dlq_pkey PRIMARY KEY (id),
  CONSTRAINT incoming_webhook_dlq_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'abandoned'::text])))
);

-- ─── public.incoming_webhook_logs ───
CREATE TABLE public.incoming_webhook_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  webhook_id uuid NOT NULL,
  status text NOT NULL,
  http_status integer,
  payload jsonb,
  response jsonb,
  error_message text,
  source_ip text,
  user_agent text,
  latency_ms integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT incoming_webhook_logs_pkey PRIMARY KEY (id)
);

-- ─── public.incoming_webhooks ───
CREATE TABLE public.incoming_webhooks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  token text NOT NULL,
  target_entity text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  allowed_origins text[] DEFAULT ARRAY[]::text[],
  field_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
  total_calls bigint DEFAULT 0 NOT NULL,
  total_errors bigint DEFAULT 0 NOT NULL,
  last_called_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  webhook_secret text,
  require_signature boolean DEFAULT false NOT NULL,
  replay_window_seconds integer DEFAULT 300 NOT NULL,
  CONSTRAINT incoming_webhooks_pkey PRIMARY KEY (id),
  CONSTRAINT incoming_webhooks_token_key UNIQUE (token),
  CONSTRAINT incoming_webhooks_target_entity_check CHECK ((target_entity = ANY (ARRAY['contact'::text, 'company'::text, 'deal'::text, 'interaction'::text, 'note'::text, 'custom'::text])))
);

-- ─── public.insights ───
CREATE TABLE public.insights (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  confidence integer DEFAULT 50,
  source text,
  actionable boolean DEFAULT false,
  action_suggestion text,
  expires_at timestamp with time zone,
  dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT insights_pkey PRIMARY KEY (id),
  CONSTRAINT insights_category_check CHECK ((category = ANY (ARRAY['personality'::text, 'preference'::text, 'behavior'::text, 'opportunity'::text, 'risk'::text, 'relationship'::text]))),
  CONSTRAINT insights_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100)))
);

-- ─── public.intent_scores ───
CREATE TABLE public.intent_scores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  scope text NOT NULL,
  scope_id text NOT NULL,
  intent_score integer DEFAULT 0 NOT NULL,
  score_trend text DEFAULT 'stable'::text NOT NULL,
  signal_count_30d integer DEFAULT 0 NOT NULL,
  top_signals jsonb DEFAULT '[]'::jsonb NOT NULL,
  computed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT intent_scores_pkey PRIMARY KEY (id),
  CONSTRAINT intent_scores_user_id_scope_scope_id_key UNIQUE (user_id, scope, scope_id),
  CONSTRAINT intent_scores_intent_score_check CHECK (((intent_score >= 0) AND (intent_score <= 100))),
  CONSTRAINT intent_scores_scope_check CHECK ((scope = ANY (ARRAY['contact'::text, 'account'::text]))),
  CONSTRAINT intent_scores_score_trend_check CHECK ((score_trend = ANY (ARRAY['rising'::text, 'stable'::text, 'falling'::text])))
);

-- ─── public.intent_signals ───
CREATE TABLE public.intent_signals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  external_company_id text,
  signal_type text NOT NULL,
  signal_source text,
  signal_value jsonb DEFAULT '{}'::jsonb NOT NULL,
  weight integer DEFAULT 1 NOT NULL,
  occurred_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT intent_signals_pkey PRIMARY KEY (id),
  CONSTRAINT intent_signals_signal_type_check CHECK ((signal_type = ANY (ARRAY['page_view'::text, 'email_open'::text, 'email_click'::text, 'form_submit'::text, 'content_download'::text, 'pricing_view'::text, 'demo_request'::text, 'social_engagement'::text, 'search_query'::text, 'competitor_mention'::text]))),
  CONSTRAINT intent_signals_weight_check CHECK (((weight >= 1) AND (weight <= 10)))
);

-- ─── public.intent_tracking_pixels ───
CREATE TABLE public.intent_tracking_pixels (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  pixel_key text NOT NULL,
  domain text NOT NULL,
  label text,
  active boolean DEFAULT true NOT NULL,
  signal_count integer DEFAULT 0 NOT NULL,
  last_signal_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT intent_tracking_pixels_pkey PRIMARY KEY (id),
  CONSTRAINT intent_tracking_pixels_pixel_key_key UNIQUE (pixel_key)
);

-- ─── public.interaction_summaries ───
CREATE TABLE public.interaction_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  company_id uuid,
  user_id uuid,
  summary text,
  key_takeaways jsonb DEFAULT '[]'::jsonb,
  next_steps text,
  negotiation_stage_summary text,
  last_interaction_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interaction_summaries_pkey PRIMARY KEY (id)
);

-- ─── public.interactions ───
CREATE TABLE public.interactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  company_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  content text,
  audio_url text,
  transcription text,
  sentiment text DEFAULT 'neutral'::text,
  tags text[] DEFAULT '{}'::text[],
  duration integer,
  attachments text[] DEFAULT '{}'::text[],
  initiated_by text DEFAULT 'us'::text,
  response_time integer,
  key_insights text[] DEFAULT '{}'::text[],
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  emotion_analysis jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  external_id text,
  nlp_analysis jsonb DEFAULT '{}'::jsonb,
  transcription_metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interactions_initiated_by_check CHECK ((initiated_by = ANY (ARRAY['us'::text, 'them'::text]))),
  CONSTRAINT interactions_sentiment_check CHECK ((sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))),
  CONSTRAINT interactions_type_check CHECK ((type = ANY (ARRAY['whatsapp'::text, 'call'::text, 'email'::text, 'meeting'::text, 'note'::text, 'social'::text])))
);

-- ─── public.interactions_audit ───
CREATE TABLE public.interactions_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  interaction_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interactions_audit_pkey PRIMARY KEY (id)
);

-- ─── public.ip_whitelist ───
CREATE TABLE public.ip_whitelist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  label text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ip_whitelist_pkey PRIMARY KEY (id)
);

-- ─── public.knowledge_base_articles ───
CREATE TABLE public.knowledge_base_articles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'geral'::text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  is_published boolean DEFAULT true,
  views_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT knowledge_base_articles_pkey PRIMARY KEY (id)
);

-- ─── public.landing_page_submissions ───
CREATE TABLE public.landing_page_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  landing_page_id uuid NOT NULL,
  user_id uuid NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  email text,
  name text,
  phone text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT landing_page_submissions_pkey PRIMARY KEY (id)
);

-- ─── public.landing_pages ───
CREATE TABLE public.landing_pages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  blocks jsonb DEFAULT '[]'::jsonb NOT NULL,
  theme jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  submission_count integer DEFAULT 0 NOT NULL,
  redirect_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT landing_pages_pkey PRIMARY KEY (id),
  CONSTRAINT landing_pages_slug_key UNIQUE (slug)
);

-- ─── public.lead_assignments ───
CREATE TABLE public.lead_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  assigned_to uuid NOT NULL,
  assigned_by uuid,
  assignment_type text DEFAULT 'auto_round_robin'::text NOT NULL,
  previous_owner uuid,
  status text DEFAULT 'active'::text NOT NULL,
  routing_rule_id uuid,
  sla_deadline timestamp with time zone,
  first_contact_at timestamp with time zone,
  sla_met boolean,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT lead_assignments_assignment_type_check CHECK ((assignment_type = ANY (ARRAY['auto_round_robin'::text, 'auto_weighted'::text, 'auto_territory'::text, 'manual'::text, 'handoff'::text, 'redistribution'::text]))),
  CONSTRAINT lead_assignments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'expired'::text, 'reassigned'::text])))
);

-- ─── public.lead_magnet_downloads ───
CREATE TABLE public.lead_magnet_downloads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  magnet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  email text,
  name text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  downloaded_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_magnet_downloads_pkey PRIMARY KEY (id)
);

-- ─── public.lead_magnets ───
CREATE TABLE public.lead_magnets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  type text DEFAULT 'ebook'::text NOT NULL,
  file_path text,
  external_url text,
  thumbnail_url text,
  gated boolean DEFAULT true NOT NULL,
  form_id uuid,
  download_count integer DEFAULT 0 NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_magnets_pkey PRIMARY KEY (id),
  CONSTRAINT lead_magnets_slug_key UNIQUE (slug),
  CONSTRAINT lead_magnets_type_check CHECK ((type = ANY (ARRAY['ebook'::text, 'webinar'::text, 'whitepaper'::text, 'template'::text, 'video'::text, 'checklist'::text, 'other'::text])))
);

-- ─── public.lead_routing_rules ───
CREATE TABLE public.lead_routing_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  rule_type text DEFAULT 'round_robin'::text NOT NULL,
  priority integer DEFAULT 1 NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
  team_pool uuid[] DEFAULT '{}'::uuid[],
  role_filter text DEFAULT 'any'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  fallback_rule_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_routing_rules_pkey PRIMARY KEY (id),
  CONSTRAINT lead_routing_rules_role_filter_check CHECK ((role_filter = ANY (ARRAY['sdr'::text, 'closer'::text, 'any'::text]))),
  CONSTRAINT lead_routing_rules_rule_type_check CHECK ((rule_type = ANY (ARRAY['round_robin'::text, 'weighted'::text, 'territory'::text, 'specialization'::text, 'load_balanced'::text])))
);

-- ─── public.lead_score_config ───
CREATE TABLE public.lead_score_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  weight_engagement numeric(3,2) DEFAULT 0.30 NOT NULL,
  weight_fit numeric(3,2) DEFAULT 0.20 NOT NULL,
  weight_intent numeric(3,2) DEFAULT 0.25 NOT NULL,
  weight_relationship numeric(3,2) DEFAULT 0.25 NOT NULL,
  grade_thresholds jsonb DEFAULT '{"hot": 60, "cold": 0, "warm": 30, "on_fire": 85}'::jsonb NOT NULL,
  auto_recalculate boolean DEFAULT true NOT NULL,
  recalculate_interval_hours integer DEFAULT 24 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_score_config_pkey PRIMARY KEY (id),
  CONSTRAINT lead_score_config_user_id_key UNIQUE (user_id)
);

-- ─── public.lead_score_history ───
CREATE TABLE public.lead_score_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  total_score numeric(5,2) NOT NULL,
  grade text NOT NULL,
  engagement_score numeric(5,2) DEFAULT 0 NOT NULL,
  fit_score numeric(5,2) DEFAULT 0 NOT NULL,
  intent_score numeric(5,2) DEFAULT 0 NOT NULL,
  relationship_score numeric(5,2) DEFAULT 0 NOT NULL,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL,
  breakdown jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT lead_score_history_pkey PRIMARY KEY (id)
);

-- ─── public.lead_score_recompute_queue ───
CREATE TABLE public.lead_score_recompute_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  reason text DEFAULT 'manual'::text NOT NULL,
  enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone,
  CONSTRAINT lead_score_recompute_queue_pkey PRIMARY KEY (id)
);

-- ─── public.lead_score_rules ───
CREATE TABLE public.lead_score_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  dimension text NOT NULL,
  signal_key text NOT NULL,
  weight numeric(5,2) DEFAULT 1 NOT NULL,
  decay_days integer DEFAULT 30 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_score_rules_pkey PRIMARY KEY (id),
  CONSTRAINT lead_score_rules_user_id_dimension_signal_key_key UNIQUE (user_id, dimension, signal_key),
  CONSTRAINT lead_score_rules_dimension_check CHECK ((dimension = ANY (ARRAY['fit'::text, 'engagement'::text, 'intent'::text, 'relationship'::text])))
);

-- ─── public.lead_score_threshold_automations ───
CREATE TABLE public.lead_score_threshold_automations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  grade_target text,
  score_target integer,
  action_type text NOT NULL,
  action_config jsonb DEFAULT '{}'::jsonb NOT NULL,
  cooldown_hours integer DEFAULT 24 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  last_fired_at timestamp with time zone,
  fired_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_score_threshold_automations_pkey PRIMARY KEY (id),
  CONSTRAINT lead_score_threshold_automations_action_type_check CHECK ((action_type = ANY (ARRAY['notify'::text, 'create_task'::text, 'enroll_sequence'::text, 'webhook'::text, 'tag'::text]))),
  CONSTRAINT lead_score_threshold_automations_cooldown_hours_check CHECK ((cooldown_hours >= 0)),
  CONSTRAINT lead_score_threshold_automations_grade_target_check CHECK ((grade_target = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text]))),
  CONSTRAINT lead_score_threshold_automations_score_target_check CHECK (((score_target >= 0) AND (score_target <= 100))),
  CONSTRAINT lead_score_threshold_automations_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['grade_reached'::text, 'grade_dropped'::text, 'score_above'::text, 'score_below'::text])))
);

-- ─── public.lead_score_threshold_log ───
CREATE TABLE public.lead_score_threshold_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  automation_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  from_grade text,
  to_grade text,
  from_score numeric,
  to_score numeric,
  action_result jsonb DEFAULT '{}'::jsonb NOT NULL,
  success boolean DEFAULT true NOT NULL,
  fired_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_score_threshold_log_pkey PRIMARY KEY (id)
);

-- ─── public.lead_score_thresholds ───
CREATE TABLE public.lead_score_thresholds (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  grade text NOT NULL,
  min_score numeric(5,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_score_thresholds_pkey PRIMARY KEY (id),
  CONSTRAINT lead_score_thresholds_user_id_grade_key UNIQUE (user_id, grade),
  CONSTRAINT lead_score_thresholds_grade_check CHECK ((grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text])))
);

-- ─── public.lead_scores ───
CREATE TABLE public.lead_scores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  total_score numeric(5,2) DEFAULT 0 NOT NULL,
  grade text DEFAULT 'D'::text NOT NULL,
  engagement_score numeric(5,2) DEFAULT 0 NOT NULL,
  fit_score numeric(5,2) DEFAULT 0 NOT NULL,
  intent_score numeric(5,2) DEFAULT 0 NOT NULL,
  relationship_score numeric(5,2) DEFAULT 0 NOT NULL,
  score_factors jsonb DEFAULT '[]'::jsonb NOT NULL,
  weight_engagement numeric(3,2) DEFAULT 0.30 NOT NULL,
  weight_fit numeric(3,2) DEFAULT 0.20 NOT NULL,
  weight_intent numeric(3,2) DEFAULT 0.25 NOT NULL,
  weight_relationship numeric(3,2) DEFAULT 0.25 NOT NULL,
  last_calculated_at timestamp with time zone DEFAULT now() NOT NULL,
  score_change numeric(5,2) DEFAULT 0,
  previous_score numeric(5,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  computed_at timestamp with time zone DEFAULT now() NOT NULL,
  decay_applied_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lead_scores_pkey PRIMARY KEY (id),
  CONSTRAINT lead_scores_contact_id_user_id_key UNIQUE (contact_id, user_id),
  CONSTRAINT lead_scores_grade_check CHECK ((grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text, 'cold'::text, 'warm'::text, 'hot'::text, 'on_fire'::text])))
);

-- ─── public.life_events ───
CREATE TABLE public.life_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  event_type text NOT NULL,
  event_date timestamp with time zone NOT NULL,
  title text NOT NULL,
  description text,
  recurring boolean DEFAULT false,
  reminder_days_before integer DEFAULT 7,
  last_reminded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT life_events_pkey PRIMARY KEY (id),
  CONSTRAINT check_event_type CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'promotion'::text, 'travel'::text, 'family'::text, 'achievement'::text, 'other'::text]))),
  CONSTRAINT check_reminder_days CHECK ((reminder_days_before >= 0)),
  CONSTRAINT life_events_event_type_check CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'promotion'::text, 'travel'::text, 'family'::text, 'achievement'::text, 'other'::text]))),
  CONSTRAINT life_events_reminder_days_before_check CHECK ((reminder_days_before >= 0)),
  CONSTRAINT life_events_type_check CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'promotion'::text, 'travel'::text, 'family'::text, 'achievement'::text, 'other'::text])))
);

-- ─── public.life_events_history ───
CREATE TABLE public.life_events_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  life_event_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  title text NOT NULL,
  event_date timestamp with time zone NOT NULL,
  recurring boolean,
  reminder_days_before integer,
  change_type text NOT NULL,
  reason text,
  changed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT life_events_history_pkey PRIMARY KEY (id)
);

-- ─── public.login_attempts ───
CREATE TABLE public.login_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean DEFAULT false,
  blocked_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
);

-- ─── public.lux_intelligence ───
CREATE TABLE public.lux_intelligence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  request_type text DEFAULT 'full_scan'::text NOT NULL,
  social_profiles jsonb DEFAULT '[]'::jsonb,
  social_analysis jsonb DEFAULT '{}'::jsonb,
  fiscal_data jsonb DEFAULT '{}'::jsonb,
  stakeholders jsonb DEFAULT '[]'::jsonb,
  audience_analysis jsonb DEFAULT '{}'::jsonb,
  personal_profile jsonb DEFAULT '{}'::jsonb,
  ai_report text,
  ai_summary text,
  fields_updated jsonb DEFAULT '[]'::jsonb,
  error_message text,
  n8n_execution_id text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT lux_intelligence_pkey PRIMARY KEY (id),
  CONSTRAINT lux_intelligence_entity_type_check CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text]))),
  CONSTRAINT lux_intelligence_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'error'::text])))
);

-- ─── public.lux_webhook_config ───
CREATE TABLE public.lux_webhook_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  entity_type text NOT NULL,
  webhook_url text NOT NULL,
  is_active boolean DEFAULT true,
  timeout_ms integer DEFAULT 60000,
  max_retries integer DEFAULT 3,
  headers jsonb DEFAULT '{}'::jsonb,
  last_test_at timestamp with time zone,
  last_test_status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lux_webhook_config_pkey PRIMARY KEY (id),
  CONSTRAINT lux_webhook_config_entity_type_key UNIQUE (entity_type),
  CONSTRAINT lux_webhook_config_entity_type_check CHECK ((entity_type = ANY (ARRAY['contact'::text, 'company'::text])))
);

-- ─── public.marketing_campaign_stats ───
CREATE TABLE public.marketing_campaign_stats (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  campaign_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  submissions integer DEFAULT 0,
  conversions integer DEFAULT 0,
  spend numeric(12,2) DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT marketing_campaign_stats_pkey PRIMARY KEY (id)
);

-- ─── public.marketing_roi_data ───
CREATE TABLE public.marketing_roi_data (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  channel text NOT NULL,
  investment numeric(12,2) DEFAULT 0 NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  leads_generated integer DEFAULT 0,
  customers_acquired integer DEFAULT 0,
  revenue_generated numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT marketing_roi_data_pkey PRIMARY KEY (id)
);

-- ─── public.mcp_tool_calls ───
CREATE TABLE public.mcp_tool_calls (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  connection_id uuid,
  tool_name text NOT NULL,
  arguments_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text NOT NULL,
  error_message text,
  latency_ms integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT mcp_tool_calls_pkey PRIMARY KEY (id),
  CONSTRAINT mcp_tool_calls_status_check CHECK ((status = ANY (ARRAY['success'::text, 'error'::text, 'denied'::text])))
);

-- ─── public.meeting_summaries ───
CREATE TABLE public.meeting_summaries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  interaction_id uuid NOT NULL,
  user_id uuid NOT NULL,
  summary text NOT NULL,
  key_decisions text[] DEFAULT '{}'::text[],
  action_items jsonb DEFAULT '[]'::jsonb,
  participants text[] DEFAULT '{}'::text[],
  sentiment_overview text,
  topics text[] DEFAULT '{}'::text[],
  next_steps text[] DEFAULT '{}'::text[],
  duration_minutes integer,
  generated_by_model text DEFAULT 'gemini-2.5-flash'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT meeting_summaries_pkey PRIMARY KEY (id)
);

-- ─── public.metaprogram_analysis ───
CREATE TABLE public.metaprogram_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  toward_score integer DEFAULT 0,
  away_from_score integer DEFAULT 0,
  toward_words text[] DEFAULT '{}'::text[],
  away_from_words text[] DEFAULT '{}'::text[],
  internal_score integer DEFAULT 0,
  external_score integer DEFAULT 0,
  internal_words text[] DEFAULT '{}'::text[],
  external_words text[] DEFAULT '{}'::text[],
  options_score integer DEFAULT 0,
  procedures_score integer DEFAULT 0,
  options_words text[] DEFAULT '{}'::text[],
  procedures_words text[] DEFAULT '{}'::text[],
  analyzed_text text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_validated boolean DEFAULT false,
  user_feedback text,
  CONSTRAINT metaprogram_analysis_pkey PRIMARY KEY (id)
);

-- ─── public.mql_classifications ───
CREATE TABLE public.mql_classifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  criteria_id uuid,
  status text DEFAULT 'mql'::text NOT NULL,
  qualified_at timestamp with time zone DEFAULT now() NOT NULL,
  handoff_assignment_id uuid,
  handoff_to uuid,
  handoff_at timestamp with time zone,
  score_snapshot integer,
  reason text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT mql_classifications_pkey PRIMARY KEY (id),
  CONSTRAINT mql_classifications_status_check CHECK ((status = ANY (ARRAY['mql'::text, 'sql'::text, 'disqualified'::text, 'customer'::text])))
);

-- ─── public.mql_criteria ───
CREATE TABLE public.mql_criteria (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  auto_handoff boolean DEFAULT false NOT NULL,
  handoff_to_role text DEFAULT 'sdr'::text NOT NULL,
  priority integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT mql_criteria_pkey PRIMARY KEY (id),
  CONSTRAINT mql_criteria_handoff_to_role_check CHECK ((handoff_to_role = ANY (ARRAY['sdr'::text, 'closer'::text, 'manager'::text])))
);

-- ─── public.neuro_behavioral_history ───
CREATE TABLE public.neuro_behavioral_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  dominance_data jsonb,
  neuromarketing_data jsonb,
  empathy_score numeric,
  recommendations text[],
  created_at timestamp with time zone DEFAULT now(),
  empathy_trend jsonb DEFAULT '[]'::jsonb,
  language_complexity_score double precision DEFAULT 0.0,
  response_synchronicity double precision DEFAULT 0.0,
  CONSTRAINT neuro_behavioral_history_pkey PRIMARY KEY (id)
);

-- ─── public.neuro_pnl_sessions ───
CREATE TABLE public.neuro_pnl_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  company_id uuid,
  conversation_id text,
  session_date timestamp with time zone DEFAULT now(),
  technique_used text,
  results_summary text,
  emotional_state_before text,
  emotional_state_after text,
  anchors_installed jsonb DEFAULT '[]'::jsonb,
  next_steps text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT neuro_pnl_sessions_pkey PRIMARY KEY (id)
);

-- ─── public.nlp_feedback ───
CREATE TABLE public.nlp_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  contact_id uuid,
  interaction_id uuid,
  analysis_type text NOT NULL,
  original_detection jsonb,
  adjusted_value jsonb,
  is_correct boolean,
  feedback_notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nlp_feedback_pkey PRIMARY KEY (id)
);

-- ─── public.notification_logs ───
CREATE TABLE public.notification_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reminder_id text NOT NULL,
  contact_id uuid,
  user_id uuid,
  channel text NOT NULL,
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT notification_logs_pkey PRIMARY KEY (id),
  CONSTRAINT notification_logs_reminder_id_channel_key UNIQUE (reminder_id, channel)
);

-- ─── public.notification_preferences ───
CREATE TABLE public.notification_preferences (
  user_id uuid NOT NULL,
  quiet_hours_start smallint DEFAULT 22 NOT NULL,
  quiet_hours_end smallint DEFAULT 8 NOT NULL,
  weekend_silence boolean DEFAULT false NOT NULL,
  enabled_channels text[] DEFAULT ARRAY['in_app'::text] NOT NULL,
  min_urgency_email text DEFAULT 'high'::text NOT NULL,
  min_urgency_push text DEFAULT 'critical'::text NOT NULL,
  digest_mode text DEFAULT 'immediate'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id),
  CONSTRAINT notification_preferences_digest_mode_check CHECK ((digest_mode = ANY (ARRAY['immediate'::text, 'hourly'::text, 'daily'::text]))),
  CONSTRAINT notification_preferences_quiet_hours_end_check CHECK (((quiet_hours_end >= 0) AND (quiet_hours_end <= 23))),
  CONSTRAINT notification_preferences_quiet_hours_start_check CHECK (((quiet_hours_start >= 0) AND (quiet_hours_start <= 23)))
);

-- ─── public.nurturing_enrollments ───
CREATE TABLE public.nurturing_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workflow_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  current_step integer DEFAULT 0,
  status text DEFAULT 'active'::text,
  enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  next_action_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT nurturing_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT nurturing_enrollments_workflow_id_contact_id_key UNIQUE (workflow_id, contact_id),
  CONSTRAINT nurturing_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])))
);

-- ─── public.nurturing_executions ───
CREATE TABLE public.nurturing_executions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  current_step integer DEFAULT 0 NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  next_action_at timestamp with time zone,
  last_action_at timestamp with time zone,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  error_message text,
  context jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT nurturing_executions_pkey PRIMARY KEY (id),
  CONSTRAINT nurturing_executions_workflow_id_contact_id_key UNIQUE (workflow_id, contact_id),
  CONSTRAINT nurturing_executions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text, 'failed'::text])))
);

-- ─── public.nurturing_workflows ───
CREATE TABLE public.nurturing_workflows (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text DEFAULT 'manual'::text,
  trigger_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  steps jsonb DEFAULT '[]'::jsonb,
  enrolled_count integer DEFAULT 0,
  completed_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT nurturing_workflows_pkey PRIMARY KEY (id),
  CONSTRAINT nurturing_workflows_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['manual'::text, 'tag_added'::text, 'stage_changed'::text, 'score_below'::text, 'score_above'::text])))
);

-- ─── public.objection_example_feedback ───
CREATE TABLE public.objection_example_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  objection text NOT NULL,
  category text,
  interaction_id uuid,
  is_useful boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT objection_example_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT objection_example_feedback_unique UNIQUE (user_id, objection, interaction_id)
);

-- ─── public.offer_suggestions ───
CREATE TABLE public.offer_suggestions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  offer_name text NOT NULL,
  offer_category text,
  reason text NOT NULL,
  confidence_score integer DEFAULT 50,
  status text DEFAULT 'pending'::text,
  presented_at timestamp with time zone,
  result text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT offer_suggestions_pkey PRIMARY KEY (id)
);

-- ─── public.password_reset_requests ───
CREATE TABLE public.password_reset_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  approved_by uuid,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id)
);

-- ─── public.people_intelligence_events ───
CREATE TABLE public.people_intelligence_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  event_type text NOT NULL,
  old_value text,
  new_value text,
  field_name text,
  source text DEFAULT 'system_trigger'::text NOT NULL,
  confidence integer DEFAULT 100 NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  detected_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT people_intelligence_events_pkey PRIMARY KEY (id),
  CONSTRAINT people_intelligence_events_confidence_check CHECK (((confidence >= 0) AND (confidence <= 100))),
  CONSTRAINT people_intelligence_events_event_type_check CHECK ((event_type = ANY (ARRAY['job_change'::text, 'promotion'::text, 'company_change'::text, 'title_change'::text, 'linkedin_update'::text, 'social_event'::text, 'other'::text])))
);

-- ─── public.permissions ───
CREATE TABLE public.permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  module text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id),
  CONSTRAINT permissions_name_key UNIQUE (name)
);

-- ─── public.phone_validations ───
CREATE TABLE public.phone_validations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  phone_input text NOT NULL,
  phone_e164 text,
  status text DEFAULT 'unknown'::text NOT NULL,
  line_type text,
  country text,
  country_code text,
  carrier text,
  is_active boolean,
  reasons text[] DEFAULT ARRAY[]::text[] NOT NULL,
  provider text DEFAULT 'libphonenumber'::text NOT NULL,
  raw jsonb DEFAULT '{}'::jsonb NOT NULL,
  validated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT phone_validations_pkey PRIMARY KEY (id),
  CONSTRAINT phone_validations_line_type_check CHECK ((line_type = ANY (ARRAY['mobile'::text, 'landline'::text, 'voip'::text, 'toll_free'::text, 'premium'::text, 'unknown'::text]))),
  CONSTRAINT phone_validations_status_check CHECK ((status = ANY (ARRAY['valid'::text, 'invalid'::text, 'unreachable'::text, 'unknown'::text])))
);

-- ─── public.pipeline_stage_transitions ───
CREATE TABLE public.pipeline_stage_transitions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  allowed boolean DEFAULT true,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pipeline_stage_transitions_pkey PRIMARY KEY (id),
  CONSTRAINT pipeline_stage_transitions_from_to_idx UNIQUE (from_stage, to_stage)
);

-- ─── public.pipeline_stages ───
CREATE TABLE public.pipeline_stages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pipeline_id uuid NOT NULL,
  name text NOT NULL,
  probability integer DEFAULT 10,
  order_index integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id)
);

-- ─── public.pipelines ───
CREATE TABLE public.pipelines (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT pipelines_pkey PRIMARY KEY (id)
);

-- ─── public.playbook_usage_log ───
CREATE TABLE public.playbook_usage_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  playbook_id uuid,
  battle_card_id uuid,
  contact_id uuid,
  deal_id text,
  action text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  opened_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT playbook_usage_log_pkey PRIMARY KEY (id),
  CONSTRAINT playbook_usage_log_action_check CHECK ((action = ANY (ARRAY['opened'::text, 'copied'::text, 'shared'::text, 'recommended'::text, 'used_in_deal'::text])))
);

-- ─── public.profiles ───
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  role_title text,
  company_name text,
  phone text,
  preferences jsonb DEFAULT '{"theme": "light", "language": "pt-BR", "notifications": true}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  nlp_profile jsonb DEFAULT '{"vakProfile": null, "discProfile": null, "metaprograms": {"chunkSize": null, "actionFilter": null, "workingStyle": null, "referenceFrame": null, "comparisonStyle": null, "motivationDirection": null}}'::jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- ─── public.proximo_passo_feedback ───
CREATE TABLE public.proximo_passo_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id text NOT NULL,
  passo_id text NOT NULL,
  outcome passo_outcome NOT NULL,
  channel_used text,
  notes text,
  executed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT proximo_passo_feedback_pkey PRIMARY KEY (id)
);

-- ─── public.psychographic_audit_log ───
CREATE TABLE public.psychographic_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  changed_by uuid,
  change_type text NOT NULL,
  previous_values jsonb,
  new_values jsonb,
  changed_fields text[],
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT psychographic_audit_log_pkey PRIMARY KEY (id)
);

-- ─── public.purchase_history ───
CREATE TABLE public.purchase_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  product_name text NOT NULL,
  product_category text,
  amount numeric(12,2),
  purchase_date timestamp with time zone DEFAULT now() NOT NULL,
  renewal_date timestamp with time zone,
  cycle_months integer,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT purchase_history_pkey PRIMARY KEY (id)
);

-- ─── public.push_subscriptions ───
CREATE TABLE public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint)
);

-- ─── public.query_telemetry ───
CREATE TABLE public.query_telemetry (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  operation text NOT NULL,
  table_name text,
  rpc_name text,
  duration_ms integer DEFAULT 0 NOT NULL,
  record_count integer,
  query_limit integer,
  query_offset integer,
  count_mode text,
  severity text DEFAULT 'normal'::text NOT NULL,
  error_message text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT query_telemetry_pkey PRIMARY KEY (id)
);

-- ─── public.redistribution_log ───
CREATE TABLE public.redistribution_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  from_member_id uuid,
  to_member_id uuid,
  reason text DEFAULT 'inactivity'::text NOT NULL,
  auto_triggered boolean DEFAULT false NOT NULL,
  inactivity_days integer,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT redistribution_log_pkey PRIMARY KEY (id),
  CONSTRAINT redistribution_log_reason_check CHECK ((reason = ANY (ARRAY['inactivity'::text, 'capacity'::text, 'territory_change'::text, 'manual'::text, 'vacation'::text, 'performance'::text])))
);

-- ─── public.reframing_analysis ───
CREATE TABLE public.reframing_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  objection text NOT NULL,
  objection_category text,
  pattern_used text NOT NULL,
  suggested_response text NOT NULL,
  confidence_score integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  feedback text,
  validation_feedback jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT reframing_analysis_pkey PRIMARY KEY (id)
);

-- ─── public.reframing_analysis_audit ───
CREATE TABLE public.reframing_analysis_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  analysis_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reframing_analysis_audit_pkey PRIMARY KEY (id)
);

-- ─── public.revops_alerts ───
CREATE TABLE public.revops_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  severity text NOT NULL,
  message text NOT NULL,
  current_value numeric(14,2),
  expected_value numeric(14,2),
  period date,
  dismissed boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT revops_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT revops_alerts_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])))
);

-- ─── public.revops_benchmarks ───
CREATE TABLE public.revops_benchmarks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  target_value numeric(14,2) NOT NULL,
  warning_threshold numeric(5,2) DEFAULT 90 NOT NULL,
  critical_threshold numeric(5,2) DEFAULT 75 NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT revops_benchmarks_pkey PRIMARY KEY (id),
  CONSTRAINT revops_benchmarks_user_id_metric_key_key UNIQUE (user_id, metric_key)
);

-- ─── public.revops_snapshots ───
CREATE TABLE public.revops_snapshots (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  period date NOT NULL,
  funnel_stage text NOT NULL,
  count integer DEFAULT 0 NOT NULL,
  conversion_rate numeric(5,2),
  avg_velocity_days numeric(8,2),
  total_value numeric(14,2) DEFAULT 0,
  captured_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT revops_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT revops_snapshots_user_id_period_funnel_stage_key UNIQUE (user_id, period, funnel_stage),
  CONSTRAINT revops_snapshots_funnel_stage_check CHECK ((funnel_stage = ANY (ARRAY['visitor'::text, 'lead'::text, 'mql'::text, 'sql'::text, 'opportunity'::text, 'customer'::text])))
);

-- ─── public.rfm_analysis ───
CREATE TABLE public.rfm_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  recency_score integer NOT NULL,
  frequency_score integer NOT NULL,
  monetary_score integer NOT NULL,
  rfm_score integer DEFAULT (((recency_score * 100) + (frequency_score * 10)) + monetary_score),
  total_score integer DEFAULT ((recency_score + frequency_score) + monetary_score),
  days_since_last_purchase integer,
  days_since_last_interaction integer,
  total_purchases integer DEFAULT 0,
  total_interactions integer DEFAULT 0,
  total_monetary_value numeric(12,2) DEFAULT 0,
  average_order_value numeric(12,2) DEFAULT 0,
  segment text NOT NULL,
  segment_description text,
  segment_color text,
  recency_trend text,
  frequency_trend text,
  monetary_trend text,
  overall_trend text,
  predicted_next_purchase_date date,
  predicted_lifetime_value numeric(12,2),
  churn_probability numeric(5,2),
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  recommended_offers jsonb DEFAULT '[]'::jsonb,
  communication_priority text,
  analyzed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT rfm_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT rfm_analysis_user_id_contact_id_key UNIQUE (user_id, contact_id),
  CONSTRAINT rfm_analysis_communication_priority_check CHECK ((communication_priority = ANY (ARRAY['urgent'::text, 'high'::text, 'medium'::text, 'low'::text]))),
  CONSTRAINT rfm_analysis_frequency_score_check CHECK (((frequency_score >= 1) AND (frequency_score <= 5))),
  CONSTRAINT rfm_analysis_frequency_trend_check CHECK ((frequency_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))),
  CONSTRAINT rfm_analysis_monetary_score_check CHECK (((monetary_score >= 1) AND (monetary_score <= 5))),
  CONSTRAINT rfm_analysis_monetary_trend_check CHECK ((monetary_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))),
  CONSTRAINT rfm_analysis_overall_trend_check CHECK ((overall_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))),
  CONSTRAINT rfm_analysis_recency_score_check CHECK (((recency_score >= 1) AND (recency_score <= 5))),
  CONSTRAINT rfm_analysis_recency_trend_check CHECK ((recency_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text])))
);

-- ─── public.rfm_history ───
CREATE TABLE public.rfm_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  recency_score integer NOT NULL,
  frequency_score integer NOT NULL,
  monetary_score integer NOT NULL,
  segment text NOT NULL,
  total_monetary_value numeric(12,2),
  recorded_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT rfm_history_pkey PRIMARY KEY (id)
);

-- ─── public.rfm_metrics ───
CREATE TABLE public.rfm_metrics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL,
  champions_count integer DEFAULT 0,
  loyal_count integer DEFAULT 0,
  potential_loyalist_count integer DEFAULT 0,
  recent_customers_count integer DEFAULT 0,
  promising_count integer DEFAULT 0,
  needing_attention_count integer DEFAULT 0,
  about_to_sleep_count integer DEFAULT 0,
  at_risk_count integer DEFAULT 0,
  cant_lose_count integer DEFAULT 0,
  hibernating_count integer DEFAULT 0,
  lost_count integer DEFAULT 0,
  total_contacts_analyzed integer DEFAULT 0,
  average_rfm_score numeric(5,2),
  average_monetary_value numeric(12,2),
  total_revenue numeric(12,2),
  segment_transitions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT rfm_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT rfm_metrics_user_id_period_start_period_end_period_type_key UNIQUE (user_id, period_start, period_end, period_type),
  CONSTRAINT rfm_metrics_period_type_check CHECK ((period_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text])))
);

-- ─── public.rfm_segment_config ───
CREATE TABLE public.rfm_segment_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  segment_name text NOT NULL,
  segment_key text NOT NULL,
  description text,
  color text,
  icon text,
  recency_min integer DEFAULT 1 NOT NULL,
  recency_max integer DEFAULT 5 NOT NULL,
  frequency_min integer DEFAULT 1 NOT NULL,
  frequency_max integer DEFAULT 5 NOT NULL,
  monetary_min integer DEFAULT 1 NOT NULL,
  monetary_max integer DEFAULT 5 NOT NULL,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  email_template text,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT rfm_segment_config_pkey PRIMARY KEY (id),
  CONSTRAINT rfm_segment_config_user_id_segment_key_key UNIQUE (user_id, segment_key)
);

-- ─── public.role_permissions ───
CREATE TABLE public.role_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  role app_role NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_role_permission_id_key UNIQUE (role, permission_id)
);

-- ─── public.sales_playbooks ───
CREATE TABLE public.sales_playbooks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  scenario text NOT NULL,
  stage_target text,
  industry_target text,
  persona_target text,
  content jsonb DEFAULT '{"sections": []}'::jsonb NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[] NOT NULL,
  active boolean DEFAULT true NOT NULL,
  usage_count integer DEFAULT 0 NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sales_playbooks_pkey PRIMARY KEY (id),
  CONSTRAINT sales_playbooks_scenario_check CHECK ((scenario = ANY (ARRAY['discovery'::text, 'demo'::text, 'negotiation'::text, 'objection'::text, 'closing'::text, 'winback'::text, 'onboarding'::text, 'custom'::text])))
);

-- ─── public.sales_team_members ───
CREATE TABLE public.sales_team_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  profile_user_id uuid,
  name text NOT NULL,
  email text,
  role text DEFAULT 'sdr'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  weight integer DEFAULT 5 NOT NULL,
  max_leads_day integer DEFAULT 10 NOT NULL,
  max_leads_total integer DEFAULT 50 NOT NULL,
  current_lead_count integer DEFAULT 0 NOT NULL,
  leads_today integer DEFAULT 0 NOT NULL,
  leads_today_reset_at date DEFAULT CURRENT_DATE,
  last_assigned_at timestamp with time zone,
  territories text[] DEFAULT '{}'::text[],
  specializations text[] DEFAULT '{}'::text[],
  vacation_start date,
  vacation_end date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  manager_id uuid,
  CONSTRAINT sales_team_members_pkey PRIMARY KEY (id),
  CONSTRAINT sales_team_members_role_check CHECK ((role = ANY (ARRAY['sdr'::text, 'closer'::text, 'manager'::text]))),
  CONSTRAINT sales_team_members_weight_check CHECK (((weight >= 1) AND (weight <= 10)))
);

-- ─── public.schema_drift_alerts ───
CREATE TABLE public.schema_drift_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  error_type text NOT NULL,
  entity_type text NOT NULL,
  entity_name text NOT NULL,
  error_message text,
  stack_trace text,
  user_id uuid,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schema_drift_alerts_pkey PRIMARY KEY (id)
);

-- ─── public.score_history ───
CREATE TABLE public.score_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score_type text NOT NULL,
  score_value numeric(5,2) NOT NULL,
  previous_value numeric(5,2),
  factors jsonb,
  metadata jsonb,
  calculated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT score_history_pkey PRIMARY KEY (id),
  CONSTRAINT score_history_score_type_check CHECK ((score_type = ANY (ARRAY['closing'::text, 'health'::text, 'churn'::text, 'relationship'::text, 'satisfaction'::text])))
);

-- ─── public.search_products_cache ───
CREATE TABLE public.search_products_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  external_id text,
  name text NOT NULL,
  description text,
  category text,
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  image_url text,
  price numeric,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT search_products_cache_pkey PRIMARY KEY (id)
);

-- ─── public.secret_rotation_log ───
CREATE TABLE public.secret_rotation_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  secret_name text NOT NULL,
  rotated_at timestamp with time zone DEFAULT now() NOT NULL,
  rotated_by uuid,
  old_hash text,
  new_hash text,
  reason text,
  is_automatic boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT secret_rotation_log_pkey PRIMARY KEY (id)
);

-- ─── public.semantic_search_cache ───
CREATE TABLE public.semantic_search_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  query_hash text NOT NULL,
  query_text text NOT NULL,
  results jsonb DEFAULT '[]'::jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT semantic_search_cache_pkey PRIMARY KEY (id),
  CONSTRAINT semantic_search_cache_user_id_query_hash_key UNIQUE (user_id, query_hash)
);

-- ─── public.sentiment_annotations ───
CREATE TABLE public.sentiment_annotations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  created_by uuid NOT NULL,
  contact_id uuid NOT NULL,
  week_start date NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sentiment_annotations_pkey PRIMARY KEY (id),
  CONSTRAINT sentiment_annotations_category_check CHECK ((category = ANY (ARRAY['campanha'::text, 'abordagem'::text, 'release'::text, 'reuniao'::text, 'outro'::text]))),
  CONSTRAINT sentiment_annotations_description_check CHECK (((description IS NULL) OR (char_length(description) <= 500))),
  CONSTRAINT sentiment_annotations_title_check CHECK (((char_length(title) >= 1) AND (char_length(title) <= 80)))
);

-- ─── public.sequence_enrollments ───
CREATE TABLE public.sequence_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sequence_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  current_step integer DEFAULT 1 NOT NULL,
  next_action_at timestamp with time zone,
  enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  replied_at timestamp with time zone,
  last_step_executed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_step_sent_at timestamp with time zone,
  last_event_at timestamp with time zone,
  CONSTRAINT sequence_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT sequence_enrollments_sequence_id_contact_id_key UNIQUE (sequence_id, contact_id),
  CONSTRAINT sequence_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'replied'::text, 'bounced'::text, 'unsubscribed'::text])))
);

-- ─── public.sequence_events ───
CREATE TABLE public.sequence_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  enrollment_id uuid NOT NULL,
  sequence_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  step_order integer,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sequence_events_pkey PRIMARY KEY (id),
  CONSTRAINT sequence_events_event_type_check CHECK ((event_type = ANY (ARRAY['sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'replied'::text, 'bounced'::text, 'unsubscribed'::text, 'visited_page'::text, 'meeting_booked'::text, 'failed'::text])))
);

-- ─── public.sequence_send_log ───
CREATE TABLE public.sequence_send_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  enrollment_id uuid NOT NULL,
  step_id uuid NOT NULL,
  sequence_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  step_order integer NOT NULL,
  channel text NOT NULL,
  message_id text,
  tracking_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text),
  status text DEFAULT 'sent'::text NOT NULL,
  error_message text,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  sent_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sequence_send_log_pkey PRIMARY KEY (id),
  CONSTRAINT sequence_send_log_tracking_token_key UNIQUE (tracking_token),
  CONSTRAINT sequence_send_log_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'skipped'::text, 'bounced'::text])))
);

-- ─── public.sequence_steps ───
CREATE TABLE public.sequence_steps (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sequence_id uuid NOT NULL,
  step_order integer DEFAULT 1 NOT NULL,
  channel text NOT NULL,
  delay_days integer DEFAULT 1 NOT NULL,
  delay_hours integer DEFAULT 0 NOT NULL,
  subject text,
  message_template text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  condition_type text DEFAULT 'always'::text NOT NULL,
  condition_wait_hours integer DEFAULT 0 NOT NULL,
  branch_on_yes_step integer,
  branch_on_no_step integer,
  CONSTRAINT sequence_steps_pkey PRIMARY KEY (id),
  CONSTRAINT sequence_steps_sequence_id_step_order_key UNIQUE (sequence_id, step_order),
  CONSTRAINT sequence_steps_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text, 'call'::text, 'linkedin'::text, 'sms'::text]))),
  CONSTRAINT sequence_steps_condition_type_check CHECK ((condition_type = ANY (ARRAY['always'::text, 'if_opened'::text, 'if_clicked'::text, 'if_not_opened'::text, 'if_not_replied'::text, 'if_replied'::text])))
);

-- ─── public.sequences ───
CREATE TABLE public.sequences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft'::text NOT NULL,
  pause_on_reply boolean DEFAULT true NOT NULL,
  pause_on_meeting boolean DEFAULT false NOT NULL,
  max_enrollments integer DEFAULT 100,
  total_enrolled integer DEFAULT 0 NOT NULL,
  total_completed integer DEFAULT 0 NOT NULL,
  total_replied integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sequences_pkey PRIMARY KEY (id),
  CONSTRAINT sequences_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'archived'::text])))
);

-- ─── public.smart_notifications ───
CREATE TABLE public.smart_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  title text NOT NULL,
  body text,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  urgency text DEFAULT 'normal'::text NOT NULL,
  decided_channel text DEFAULT 'in_app'::text NOT NULL,
  decision_reason text,
  bundle_key text,
  bundle_count integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  scheduled_for timestamp with time zone DEFAULT now() NOT NULL,
  delivered_at timestamp with time zone,
  dismissed_at timestamp with time zone,
  clicked_at timestamp with time zone,
  snoozed_until timestamp with time zone,
  action_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT smart_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT smart_notifications_decided_channel_check CHECK ((decided_channel = ANY (ARRAY['in_app'::text, 'email'::text, 'push'::text, 'whatsapp'::text, 'suppressed'::text]))),
  CONSTRAINT smart_notifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'delivered'::text, 'dismissed'::text, 'clicked'::text, 'suppressed'::text, 'snoozed'::text]))),
  CONSTRAINT smart_notifications_urgency_check CHECK ((urgency = ANY (ARRAY['critical'::text, 'high'::text, 'normal'::text, 'low'::text])))
);

-- ─── public.sms_campaign_recipients ───
CREATE TABLE public.sms_campaign_recipients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  provider_message_id text,
  error_message text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  failed_at timestamp with time zone,
  replied_at timestamp with time zone,
  cost_cents integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sms_campaign_recipients_pkey PRIMARY KEY (id),
  CONSTRAINT sms_campaign_recipients_campaign_id_contact_id_key UNIQUE (campaign_id, contact_id),
  CONSTRAINT sms_campaign_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'replied'::text, 'opted_out'::text])))
);

-- ─── public.sms_campaigns ───
CREATE TABLE public.sms_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  message text NOT NULL,
  sender_id text,
  status text DEFAULT 'draft'::text NOT NULL,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0 NOT NULL,
  total_sent integer DEFAULT 0 NOT NULL,
  total_delivered integer DEFAULT 0 NOT NULL,
  total_failed integer DEFAULT 0 NOT NULL,
  total_replies integer DEFAULT 0 NOT NULL,
  total_opt_outs integer DEFAULT 0 NOT NULL,
  cost_estimate_cents integer DEFAULT 0 NOT NULL,
  segment_filter jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sms_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT sms_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'paused'::text, 'failed'::text])))
);

-- ─── public.sms_opt_outs ───
CREATE TABLE public.sms_opt_outs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  contact_id uuid,
  reason text,
  opted_out_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sms_opt_outs_pkey PRIMARY KEY (id),
  CONSTRAINT sms_opt_outs_user_id_phone_key UNIQUE (user_id, phone)
);

-- ─── public.sms_templates ───
CREATE TABLE public.sms_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  body text NOT NULL,
  category text,
  variables jsonb DEFAULT '[]'::jsonb NOT NULL,
  usage_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT sms_templates_pkey PRIMARY KEY (id)
);

-- ─── public.social_behavior_analysis ───
CREATE TABLE public.social_behavior_analysis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  analysis_date timestamp with time zone DEFAULT now() NOT NULL,
  personality_traits jsonb,
  communication_style jsonb,
  interests text[],
  topics text[],
  overall_sentiment text,
  sentiment_score numeric(3,2),
  active_hours jsonb,
  active_days text[],
  influence_level text,
  influence_score numeric(3,2),
  keywords text[],
  hashtags text[],
  valuable_connections jsonb,
  sales_insights jsonb,
  executive_summary text,
  confidence numeric(3,2) DEFAULT 0.7,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT social_behavior_analysis_pkey PRIMARY KEY (id)
);

-- ─── public.social_consent_audit ───
CREATE TABLE public.social_consent_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  network text NOT NULL,
  source_url text,
  consent_type text DEFAULT 'public_data_osint'::text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT social_consent_audit_pkey PRIMARY KEY (id)
);

-- ─── public.social_life_events ───
CREATE TABLE public.social_life_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  event_type text NOT NULL,
  event_title text NOT NULL,
  event_description text,
  event_date timestamp with time zone,
  previous_value text,
  new_value text,
  confidence numeric(3,2) DEFAULT 0.8,
  metadata jsonb,
  notified boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT social_life_events_pkey PRIMARY KEY (id)
);

-- ─── public.social_profiles ───
CREATE TABLE public.social_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  profile_url text,
  profile_data jsonb,
  headline text,
  current_company text,
  current_position text,
  location text,
  connections_count integer,
  followers_count integer,
  following_count integer,
  profile_image_url text,
  cover_image_url text,
  skills text[],
  certifications text[],
  education jsonb,
  experience jsonb,
  recent_posts jsonb,
  engagement_metrics jsonb,
  last_scraped_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT social_profiles_pkey PRIMARY KEY (id)
);

-- ─── public.social_scraping_schedule ───
CREATE TABLE public.social_scraping_schedule (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  profile_url text NOT NULL,
  frequency_days integer DEFAULT 7,
  priority text DEFAULT 'normal'::text,
  enabled boolean DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  consecutive_failures integer DEFAULT 0,
  last_error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT social_scraping_schedule_pkey PRIMARY KEY (id),
  CONSTRAINT social_scraping_schedule_contact_id_platform_key UNIQUE (contact_id, platform)
);

-- ─── public.social_sync_queue ───
CREATE TABLE public.social_sync_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  status text DEFAULT 'pending'::text NOT NULL,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  error_log text,
  last_attempt timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT social_sync_queue_pkey PRIMARY KEY (id)
);

-- ─── public.stakeholder_alerts ───
CREATE TABLE public.stakeholder_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  alert_type text NOT NULL,
  severity text DEFAULT 'medium'::text NOT NULL,
  title text NOT NULL,
  description text,
  previous_value jsonb,
  current_value jsonb,
  recommended_action text,
  dismissed boolean DEFAULT false,
  dismissed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT stakeholder_alerts_pkey PRIMARY KEY (id)
);

-- ─── public.suggested_life_events ───
CREATE TABLE public.suggested_life_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone,
  source_type text NOT NULL,
  confidence double precision DEFAULT 0.0,
  status text DEFAULT 'pending'::text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT suggested_life_events_pkey PRIMARY KEY (id),
  CONSTRAINT suggested_life_events_event_type_check CHECK ((event_type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'promotion'::text, 'travel'::text, 'family'::text, 'achievement'::text, 'other'::text]))),
  CONSTRAINT suggested_life_events_source_type_check CHECK ((source_type = ANY (ARRAY['social'::text, 'conversation'::text, 'email'::text, 'manual_suggestion'::text]))),
  CONSTRAINT suggested_life_events_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);

-- ─── public.suggested_rapport_intel ───
CREATE TABLE public.suggested_rapport_intel (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  value text NOT NULL,
  source text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT suggested_rapport_intel_pkey PRIMARY KEY (id),
  CONSTRAINT suggested_rapport_intel_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
  CONSTRAINT suggested_rapport_intel_type_check CHECK ((type = ANY (ARRAY['hobby'::text, 'interest'::text])))
);

-- ─── public.support_tickets ───
CREATE TABLE public.support_tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium'::text NOT NULL,
  status text DEFAULT 'open'::text NOT NULL,
  category text DEFAULT 'general'::text,
  assigned_to uuid,
  sla_deadline timestamp with time zone,
  resolved_at timestamp with time zone,
  first_response_at timestamp with time zone,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_category_check CHECK ((category = ANY (ARRAY['general'::text, 'bug'::text, 'feature'::text, 'billing'::text, 'support'::text, 'complaint'::text, 'onboarding'::text]))),
  CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
  CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'waiting'::text, 'resolved'::text, 'closed'::text])))
);

-- ─── public.system_alerts ───
CREATE TABLE public.system_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL,
  threshold_pct numeric NOT NULL,
  consumed_pct numeric NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_simulated boolean DEFAULT COALESCE(((metadata ->> 'simulated'::text))::boolean, false),
  CONSTRAINT system_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT system_alerts_severity_check CHECK ((severity = ANY (ARRAY['warning'::text, 'high'::text, 'critical'::text])))
);

-- ─── public.system_config ───
CREATE TABLE public.system_config (
  key text NOT NULL,
  value numeric NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  CONSTRAINT system_config_pkey PRIMARY KEY (key)
);

-- ─── public.system_health_snapshots ───
CREATE TABLE public.system_health_snapshots (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
  status text NOT NULL,
  total_latency_ms integer,
  components jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT system_health_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT system_health_snapshots_status_check CHECK ((status = ANY (ARRAY['healthy'::text, 'degraded'::text, 'unhealthy'::text])))
);

-- ─── public.ticket_comments ───
CREATE TABLE public.ticket_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  ticket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT ticket_comments_pkey PRIMARY KEY (id)
);

-- ─── public.trigger_ab_tests ───
CREATE TABLE public.trigger_ab_tests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  name text NOT NULL,
  disc_profile text,
  variant_a_trigger text NOT NULL,
  variant_a_template text,
  variant_a_uses integer DEFAULT 0,
  variant_a_conversions integer DEFAULT 0,
  variant_a_avg_rating numeric(3,2) DEFAULT 0,
  variant_b_trigger text NOT NULL,
  variant_b_template text,
  variant_b_uses integer DEFAULT 0,
  variant_b_conversions integer DEFAULT 0,
  variant_b_avg_rating numeric(3,2) DEFAULT 0,
  winner text,
  confidence numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT trigger_ab_tests_pkey PRIMARY KEY (id),
  CONSTRAINT trigger_ab_tests_winner_check CHECK ((winner = ANY (ARRAY['A'::text, 'B'::text, 'tie'::text])))
);

-- ─── public.trigger_bundles ───
CREATE TABLE public.trigger_bundles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  scenario text NOT NULL,
  disc_profiles text[] DEFAULT '{}'::text[],
  vak_profiles text[] DEFAULT '{}'::text[],
  metaprograms text[] DEFAULT '{}'::text[],
  triggers text[] NOT NULL,
  sequence_timing jsonb DEFAULT '[]'::jsonb,
  neural_path jsonb DEFAULT '{}'::jsonb,
  success_rate numeric(5,2) DEFAULT 0,
  total_uses integer DEFAULT 0,
  is_system_bundle boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT trigger_bundles_pkey PRIMARY KEY (id)
);

-- ─── public.trigger_channel_effectiveness ───
CREATE TABLE public.trigger_channel_effectiveness (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  trigger_type text NOT NULL,
  channel text NOT NULL,
  uses integer DEFAULT 0,
  successes integer DEFAULT 0,
  effectiveness_score numeric(5,2) DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT trigger_channel_effectiveness_pkey PRIMARY KEY (id),
  CONSTRAINT trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key UNIQUE (user_id, contact_id, trigger_type, channel),
  CONSTRAINT trigger_channel_effectiveness_channel_check CHECK ((channel = ANY (ARRAY['whatsapp'::text, 'email'::text, 'call'::text, 'meeting'::text, 'linkedin'::text, 'sms'::text])))
);

-- ─── public.trigger_intensity_history ───
CREATE TABLE public.trigger_intensity_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  trigger_type text NOT NULL,
  intensity_level integer NOT NULL,
  result text,
  notes text,
  interaction_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT trigger_intensity_history_pkey PRIMARY KEY (id),
  CONSTRAINT trigger_intensity_history_intensity_level_check CHECK (((intensity_level >= 1) AND (intensity_level <= 5))),
  CONSTRAINT trigger_intensity_history_result_check CHECK ((result = ANY (ARRAY['success'::text, 'neutral'::text, 'failure'::text, 'resistance'::text])))
);

-- ─── public.trigger_usage_history ───
CREATE TABLE public.trigger_usage_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  trigger_type text NOT NULL,
  template_id text,
  template_title text,
  scenario text,
  channel text,
  context text,
  result text,
  notes text,
  effectiveness_rating integer,
  used_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT trigger_usage_history_pkey PRIMARY KEY (id),
  CONSTRAINT trigger_usage_history_effectiveness_rating_check CHECK (((effectiveness_rating >= 1) AND (effectiveness_rating <= 5))),
  CONSTRAINT trigger_usage_history_result_check CHECK ((result = ANY (ARRAY['success'::text, 'neutral'::text, 'failure'::text, 'pending'::text])))
);

-- ─── public.user_known_devices ───
CREATE TABLE public.user_known_devices (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text,
  browser text,
  os text,
  is_trusted boolean DEFAULT false,
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_known_devices_pkey PRIMARY KEY (id)
);

-- ─── public.user_roles ───
CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- ─── public.user_ui_preferences ───
CREATE TABLE public.user_ui_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  scope text NOT NULL,
  preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT user_ui_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_ui_preferences_user_id_scope_key UNIQUE (user_id, scope)
);

-- ─── public.vak_analysis_history ───
CREATE TABLE public.vak_analysis_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  interaction_id uuid,
  visual_score numeric(5,2) DEFAULT 0,
  auditory_score numeric(5,2) DEFAULT 0,
  kinesthetic_score numeric(5,2) DEFAULT 0,
  digital_score numeric(5,2) DEFAULT 0,
  visual_words text[] DEFAULT '{}'::text[],
  auditory_words text[] DEFAULT '{}'::text[],
  kinesthetic_words text[] DEFAULT '{}'::text[],
  digital_words text[] DEFAULT '{}'::text[],
  analyzed_text text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_validated boolean DEFAULT false,
  user_feedback text,
  CONSTRAINT vak_analysis_history_pkey PRIMARY KEY (id)
);

-- ─── public.validation_queue ───
CREATE TABLE public.validation_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  kind validation_kind NOT NULL,
  value text NOT NULL,
  status validation_queue_status DEFAULT 'pending'::validation_queue_status NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone,
  CONSTRAINT validation_queue_pkey PRIMARY KEY (id)
);

-- ─── public.visit_checkins ───
CREATE TABLE public.visit_checkins (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  notes text,
  photo_url text,
  visit_type text DEFAULT 'presencial'::text,
  check_in_at timestamp with time zone DEFAULT now() NOT NULL,
  check_out_at timestamp with time zone,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT visit_checkins_pkey PRIMARY KEY (id),
  CONSTRAINT visit_checkins_visit_type_check CHECK ((visit_type = ANY (ARRAY['presencial'::text, 'prospeccao'::text, 'suporte'::text, 'entrega'::text, 'outro'::text])))
);

-- ─── public.webauthn_credentials ───
CREATE TABLE public.webauthn_credentials (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  credential_id text NOT NULL,
  public_key text NOT NULL,
  label text DEFAULT 'Passkey'::text,
  sign_count integer DEFAULT 0,
  transports text[],
  created_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone,
  CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id),
  CONSTRAINT webauthn_credentials_credential_id_key UNIQUE (credential_id)
);

-- ─── public.weekly_report_settings ───
CREATE TABLE public.weekly_report_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  enabled boolean DEFAULT true,
  send_day text DEFAULT 'monday'::text,
  send_time text DEFAULT '09:00'::text,
  email_address text,
  include_portfolio_summary boolean DEFAULT true,
  include_at_risk_clients boolean DEFAULT true,
  include_health_alerts boolean DEFAULT true,
  include_upcoming_dates boolean DEFAULT true,
  include_recommendations boolean DEFAULT true,
  include_performance_metrics boolean DEFAULT true,
  last_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT weekly_report_settings_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_report_settings UNIQUE (user_id)
);

-- ─── public.weekly_reports ───
CREATE TABLE public.weekly_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  report_data jsonb NOT NULL,
  sent_via text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT weekly_reports_pkey PRIMARY KEY (id)
);

-- ─── public.whatsapp_ingestion_logs ───
CREATE TABLE public.whatsapp_ingestion_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  message_id text,
  event_type text NOT NULL,
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT whatsapp_ingestion_logs_pkey PRIMARY KEY (id)
);

-- ─── public.whatsapp_instances ───
CREATE TABLE public.whatsapp_instances (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  display_name text,
  phone_number text,
  status text DEFAULT 'disconnected'::text,
  profile_pic_url text,
  webhook_url text,
  auto_read_messages boolean DEFAULT false,
  auto_reply_enabled boolean DEFAULT false,
  auto_reply_message text,
  settings jsonb DEFAULT '{}'::jsonb,
  last_connected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT whatsapp_instances_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_instances_user_id_instance_name_key UNIQUE (user_id, instance_name)
);

-- ─── public.whatsapp_kpis ───
CREATE TABLE public.whatsapp_kpis (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_read integer DEFAULT 0,
  avg_response_time_seconds integer,
  delivery_rate numeric,
  read_rate numeric,
  unique_contacts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT whatsapp_kpis_pkey PRIMARY KEY (id)
);

-- ─── public.whatsapp_messages ───
CREATE TABLE public.whatsapp_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  instance_name text NOT NULL,
  remote_jid text NOT NULL,
  message_id text,
  from_me boolean DEFAULT false NOT NULL,
  message_type text DEFAULT 'text'::text NOT NULL,
  content text,
  media_url text,
  media_mimetype text,
  status text DEFAULT 'pending'::text,
  sender_name text,
  quoted_message_id text,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  played_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  company_id uuid,
  transcription_status text DEFAULT 'not_applicable'::text NOT NULL,
  duration_seconds integer,
  CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_messages_transcription_status_check CHECK ((transcription_status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text, 'not_applicable'::text])))
);

-- ─── public.whatsapp_messages_index ───
CREATE TABLE public.whatsapp_messages_index (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contact_id uuid,
  message_sid text,
  content text,
  message_type text,
  transcription text,
  sentiment text,
  intent text,
  neuro_tags jsonb DEFAULT '[]'::jsonb,
  received_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_messages_index_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_messages_index_message_sid_key UNIQUE (message_sid)
);

-- ─── public.whatsapp_transcriptions ───
CREATE TABLE public.whatsapp_transcriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  whatsapp_message_id uuid NOT NULL,
  content text NOT NULL,
  provider text DEFAULT 'openai'::text,
  confidence double precision,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_transcriptions_pkey PRIMARY KEY (id)
);

-- ─── public.win_loss_insights ───
CREATE TABLE public.win_loss_insights (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  insight_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'info'::text NOT NULL,
  supporting_data jsonb DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT win_loss_insights_pkey PRIMARY KEY (id),
  CONSTRAINT win_loss_insights_insight_type_check CHECK ((insight_type = ANY (ARRAY['pattern'::text, 'recommendation'::text, 'alert'::text]))),
  CONSTRAINT win_loss_insights_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text, 'success'::text])))
);

-- ─── public.win_loss_reasons ───
CREATE TABLE public.win_loss_reasons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  outcome_type text DEFAULT 'both'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT win_loss_reasons_pkey PRIMARY KEY (id),
  CONSTRAINT win_loss_reasons_user_id_category_label_key UNIQUE (user_id, category, label),
  CONSTRAINT win_loss_reasons_category_check CHECK ((category = ANY (ARRAY['price'::text, 'product'::text, 'timing'::text, 'relationship'::text, 'competition'::text, 'budget'::text, 'authority'::text, 'need'::text, 'other'::text]))),
  CONSTRAINT win_loss_reasons_outcome_type_check CHECK ((outcome_type = ANY (ARRAY['won'::text, 'lost'::text, 'both'::text])))
);

-- ─── public.win_loss_records ───
CREATE TABLE public.win_loss_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  deal_id text NOT NULL,
  outcome text NOT NULL,
  primary_reason_id uuid,
  secondary_reasons text[] DEFAULT ARRAY[]::text[],
  competitor_id uuid,
  deal_value numeric(14,2),
  sales_cycle_days integer,
  decision_maker_contact_id uuid,
  notes text,
  lessons_learned text,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT win_loss_records_pkey PRIMARY KEY (id),
  CONSTRAINT win_loss_records_user_id_deal_id_key UNIQUE (user_id, deal_id),
  CONSTRAINT win_loss_records_outcome_check CHECK ((outcome = ANY (ARRAY['won'::text, 'lost'::text, 'no_decision'::text, 'pending'::text])))
);


-- Comentários de tabelas e colunas
COMMENT ON TABLE public.entity_relationships IS 'Relacionamentos polimórficos entre Empresa/Pessoa com papel (comprador, gerente, proprietário, ...).';
COMMENT ON TABLE public.v_entities IS 'Visão unificada de Empresas e Pessoas como Entidades.';
COMMENT ON COLUMN public.offer_suggestions.metadata IS 'Armazena detalhes do match social, incluindo sources, keywords e social_insight_ids vinculados.';
