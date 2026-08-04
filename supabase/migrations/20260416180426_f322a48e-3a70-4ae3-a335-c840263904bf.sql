
-- Tables for security module

-- IP Whitelist
CREATE TABLE public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own IPs" ON public.ip_whitelist FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Login Attempts
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own attempts" ON public.login_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all attempts" ON public.login_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Geo-blocking: allowed countries
CREATE TABLE public.geo_allowed_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.geo_allowed_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own geo countries" ON public.geo_allowed_countries FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- City whitelist
CREATE TABLE public.city_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT,
  country_code TEXT DEFAULT 'BR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.city_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cities" ON public.city_whitelist FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Access blocked log
CREATE TABLE public.access_blocked_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  country_code TEXT,
  city TEXT,
  reason TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.access_blocked_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read blocked logs" ON public.access_blocked_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Access security settings
CREATE TABLE public.access_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enable_ip_restriction BOOLEAN DEFAULT false,
  enable_geo_blocking BOOLEAN DEFAULT false,
  enable_device_detection BOOLEAN DEFAULT true,
  notify_new_device BOOLEAN DEFAULT true,
  max_sessions INTEGER DEFAULT 5,
  session_timeout_minutes INTEGER DEFAULT 480,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.access_security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own security settings" ON public.access_security_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Known devices
CREATE TABLE public.user_known_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  is_trusted BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_known_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own devices" ON public.user_known_devices FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Device login notifications
CREATE TABLE public.device_login_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.user_known_devices(id) ON DELETE CASCADE,
  ip_address TEXT,
  location TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.device_login_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own device notifications" ON public.device_login_notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Password reset requests (admin approval flow)
CREATE TABLE public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own reset requests" ON public.password_reset_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage reset requests" ON public.password_reset_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- WebAuthn credentials
CREATE TABLE public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  label TEXT DEFAULT 'Passkey',
  sign_count INTEGER DEFAULT 0,
  transports TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own webauthn" ON public.webauthn_credentials FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Permissions table for granular RBAC
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Role-permission mapping
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission_id)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default permissions
INSERT INTO public.permissions (name, description, module, action) VALUES
  ('contacts.read', 'Visualizar contatos', 'contacts', 'read'),
  ('contacts.write', 'Criar e editar contatos', 'contacts', 'write'),
  ('contacts.delete', 'Excluir contatos', 'contacts', 'delete'),
  ('companies.read', 'Visualizar empresas', 'companies', 'read'),
  ('companies.write', 'Criar e editar empresas', 'companies', 'write'),
  ('companies.delete', 'Excluir empresas', 'companies', 'delete'),
  ('deals.read', 'Visualizar negócios', 'deals', 'read'),
  ('deals.write', 'Criar e editar negócios', 'deals', 'write'),
  ('interactions.read', 'Visualizar interações', 'interactions', 'read'),
  ('interactions.write', 'Criar interações', 'interactions', 'write'),
  ('analytics.read', 'Visualizar analytics', 'analytics', 'read'),
  ('admin.access', 'Acesso ao painel administrativo', 'admin', 'access'),
  ('admin.users', 'Gerenciar usuários', 'admin', 'users'),
  ('admin.settings', 'Gerenciar configurações', 'admin', 'settings'),
  ('security.manage', 'Gerenciar segurança', 'security', 'manage')
ON CONFLICT (name) DO NOTHING;
