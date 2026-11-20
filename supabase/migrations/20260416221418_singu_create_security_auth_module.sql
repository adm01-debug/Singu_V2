-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221418
-- nome:   singu_create_security_auth_module

-- ============================================================================
-- SINGU — SECURITY & AUTH HARDENING (10 tabelas)
-- Spec: architecture/security/* e auth/* memories
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.access_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Controles
  require_mfa boolean DEFAULT false,
  mfa_method text CHECK (mfa_method IN ('totp','webauthn','sms','email')),
  ip_whitelist_enabled boolean DEFAULT false,
  geo_restriction_enabled boolean DEFAULT false,
  device_trust_enabled boolean DEFAULT true,
  session_timeout_minutes integer DEFAULT 480,
  max_concurrent_sessions integer DEFAULT 3,
  password_policy jsonb DEFAULT '{"min_length":8,"require_uppercase":true,"require_numbers":true,"require_symbols":false,"expiry_days":90}'::jsonb,
  brute_force_threshold integer DEFAULT 5,
  brute_force_window_minutes integer DEFAULT 15,
  brute_force_lockout_minutes integer DEFAULT 30,
  notify_on_new_device boolean DEFAULT true,
  notify_on_new_location boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.access_security_settings IS 'SINGU: Config de segurança por usuário (MFA, IP whitelist, device trust, password policy, brute force thresholds).';

ALTER TABLE public.access_security_settings
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS require_mfa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_method text CHECK (mfa_method IN ('totp','webauthn','sms','email')),
  ADD COLUMN IF NOT EXISTS ip_whitelist_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS geo_restriction_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS device_trust_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS session_timeout_minutes integer DEFAULT 480,
  ADD COLUMN IF NOT EXISTS max_concurrent_sessions integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS password_policy jsonb DEFAULT '{"min_length":8,"require_uppercase":true,"require_numbers":true,"require_symbols":false,"expiry_days":90}'::jsonb,
  ADD COLUMN IF NOT EXISTS brute_force_threshold integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS brute_force_window_minutes integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS brute_force_lockout_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS notify_on_new_device boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_new_location boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.access_blocked_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  ip_address inet,
  block_reason text NOT NULL CHECK (block_reason IN ('brute_force','ip_not_whitelisted','country_blocked','device_not_trusted','rate_limit','suspicious_pattern','admin_block','other')),
  reason_details text,
  country text,
  city text,
  user_agent text,
  attempted_endpoint text,
  blocked_until timestamp with time zone,
  is_resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.access_blocked_log IS 'SINGU: Log append-only de bloqueios de acesso (brute force, IP, geo, device). Base para dashboards de segurança.';

ALTER TABLE public.access_blocked_log
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS block_reason text NOT NULL CHECK (block_reason IN ('brute_force','ip_not_whitelisted','country_blocked','device_not_trusted','rate_limit','suspicious_pattern','admin_block','other')),
  ADD COLUMN IF NOT EXISTS reason_details text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS attempted_endpoint text,
  ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  ip_address inet,
  user_agent text,
  country text,
  city text,
  success boolean NOT NULL,
  failure_reason text,
  mfa_used boolean DEFAULT false,
  device_fingerprint text,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
COMMENT ON TABLE public.login_attempts IS 'SINGU: Log de TODAS as tentativas de login (success=true/false) para detecção de brute force via query nos últimos N minutos.';

ALTER TABLE public.login_attempts
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS success boolean NOT NULL,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS mfa_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS device_fingerprint text,
  ADD COLUMN IF NOT EXISTS attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;


CREATE TABLE IF NOT EXISTS public.ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address inet NOT NULL,
  cidr_range cidr,
  label text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  use_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ip_whitelist IS 'SINGU: IPs/CIDRs permitidos por usuário. Usado se access_security_settings.ip_whitelist_enabled=true.';

ALTER TABLE public.ip_whitelist
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS ip_address inet NOT NULL,
  ADD COLUMN IF NOT EXISTS cidr_range cidr,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS use_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.geo_allowed_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  country_code char(2) NOT NULL,
  country_name text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_country_per_user UNIQUE (user_id, country_code)
);
COMMENT ON TABLE public.geo_allowed_countries IS 'SINGU: Países permitidos por usuário (ISO 3166-1 alpha-2). Usado se access_security_settings.geo_restriction_enabled=true.';

ALTER TABLE public.geo_allowed_countries
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS country_code char(2) NOT NULL,
  ADD COLUMN IF NOT EXISTS country_name text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.city_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  country_code char(2) NOT NULL,
  city_name text NOT NULL,
  region text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.city_whitelist IS 'SINGU: Cidades permitidas (mais granular que country). Para ambientes corporativos restritos.';

ALTER TABLE public.city_whitelist
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS country_code char(2) NOT NULL,
  ADD COLUMN IF NOT EXISTS city_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.user_known_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text,
  device_type text CHECK (device_type IN ('desktop','mobile','tablet','bot','unknown')),
  os text,
  browser text,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  login_count integer DEFAULT 1,
  is_trusted boolean DEFAULT false,
  trusted_at timestamp with time zone,
  is_revoked boolean DEFAULT false,
  revoked_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_device UNIQUE (user_id, device_fingerprint)
);
COMMENT ON TABLE public.user_known_devices IS 'SINGU: Dispositivos conhecidos por usuário. Trust flag permite bypass de verificações extras. Revoke imediato em caso de comprometimento.';

ALTER TABLE public.user_known_devices
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS device_fingerprint text NOT NULL,
  ADD COLUMN IF NOT EXISTS device_name text,
  ADD COLUMN IF NOT EXISTS device_type text CHECK (device_type IN ('desktop','mobile','tablet','bot','unknown')),
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_trusted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trusted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_revoked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.device_login_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('new_device','new_location','unusual_time','concurrent_session','revoked_device_attempt')),
  channel text CHECK (channel IN ('email','sms','push','in_app')),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  opened_at timestamp with time zone,
  user_action text CHECK (user_action IN ('trusted','reported_fraud','ignored','no_action')),
  user_action_at timestamp with time zone,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.device_login_notifications IS 'SINGU: Notificações enviadas em eventos de login anômalos. Trackeia resposta do usuário (trusted/reported_fraud).';

ALTER TABLE public.device_login_notifications
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS device_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL CHECK (event_type IN ('new_device','new_location','unusual_time','concurrent_session','revoked_device_attempt')),
  ADD COLUMN IF NOT EXISTS channel text CHECK (channel IN ('email','sms','push','in_app')),
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS user_action text CHECK (user_action IN ('trusted','reported_fraud','ignored','no_action')),
  ADD COLUMN IF NOT EXISTS user_action_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  token_hash text NOT NULL,
  ip_address inet,
  user_agent text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  is_used boolean DEFAULT false,
  is_revoked boolean DEFAULT false,
  attempt_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);
COMMENT ON TABLE public.password_reset_requests IS 'SINGU: Tokens de reset de senha (armazenados como hash). Single-use com expiração.';

ALTER TABLE public.password_reset_requests
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS email text NOT NULL,
  ADD COLUMN IF NOT EXISTS token_hash text NOT NULL,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS requested_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL,
  ADD COLUMN IF NOT EXISTS used_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_revoked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key bytea NOT NULL,
  counter bigint DEFAULT 0,
  transports text[] DEFAULT '{}'::text[],
  aaguid uuid,
  device_type text,
  backup_eligible boolean DEFAULT false,
  backup_state boolean DEFAULT false,
  nickname text,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.webauthn_credentials IS 'SINGU: Credenciais WebAuthn/Passkeys (FIDO2). counter protege contra replay. public_key em bytea.';

ALTER TABLE public.webauthn_credentials
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS credential_id text NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS public_key bytea NOT NULL,
  ADD COLUMN IF NOT EXISTS counter bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transports text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS aaguid uuid,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS backup_eligible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS backup_state boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_blocked_user ON public.access_blocked_log (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_access_blocked_ip ON public.access_blocked_log (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts (ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_failures ON public.login_attempts (email, attempted_at DESC) WHERE success=false;
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_user_active ON public.ip_whitelist (user_id, is_active) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS idx_geo_allowed_user ON public.geo_allowed_countries (user_id, is_active) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS idx_user_known_devices_user ON public.user_known_devices (user_id, is_trusted);
CREATE INDEX IF NOT EXISTS idx_device_login_notif_user ON public.device_login_notifications (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON public.password_reset_requests (email, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_valid ON public.password_reset_requests (token_hash) WHERE is_used=false AND is_revoked=false;
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON public.webauthn_credentials (user_id, is_active) WHERE is_active=true;

-- RLS — Tabelas de segurança exigem acesso controlado
-- access_blocked_log + login_attempts + password_reset_requests só leitura via service_role ou self
DO $$
DECLARE t text;
BEGIN
  -- Tabelas com user_id NOT NULL (padrão SINGU)
  FOR t IN SELECT unnest(ARRAY['access_security_settings','ip_whitelist','geo_allowed_countries','city_whitelist',
                               'user_known_devices','device_login_notifications','webauthn_credentials'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Users can view own" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can insert own" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can update own" ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can delete own" ON public.%I FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "service_role_full" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='updated_at') THEN
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END IF;
  END LOOP;

  -- Tabelas com user_id opcional (logs de segurança) — só service_role escreve
  FOR t IN SELECT unnest(ARRAY['access_blocked_log','login_attempts','password_reset_requests'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "service_role_full" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
