-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260315172339
-- nome:   create_uapi_sessions

-- Tabela de sessões UAPI Lalamove
CREATE TABLE public.uapi_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'lalamove',
  label TEXT NOT NULL DEFAULT 'default',
  
  -- Credenciais UAPI
  token TEXT NOT NULL,
  refresh_token TEXT,
  device_id TEXT NOT NULL,
  username TEXT,
  
  -- Parâmetros de contexto
  base_url TEXT NOT NULL DEFAULT 'https://br-uapi.lalamove.com',
  city_id TEXT NOT NULL DEFAULT '21001',
  hcountry TEXT NOT NULL DEFAULT '20000',
  hlang TEXT NOT NULL DEFAULT 'pt_br',
  version TEXT NOT NULL DEFAULT '5.38.0',
  revision TEXT NOT NULL DEFAULT '53800',
  is_ep TEXT NOT NULL DEFAULT '1',
  
  -- Headers especiais (se necessários)
  x_sign_js TEXT,
  x_javascript_fingerprinting TEXT,
  x_h5_sdkversion TEXT DEFAULT '4000',
  
  -- Controle de validade
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca rápida do token ativo
CREATE UNIQUE INDEX idx_uapi_sessions_active 
  ON public.uapi_sessions (provider, label) 
  WHERE is_active = true;

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_uapi_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_uapi_sessions_updated_at
  BEFORE UPDATE ON public.uapi_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_uapi_sessions_updated_at();

-- RLS
ALTER TABLE public.uapi_sessions ENABLE ROW LEVEL SECURITY;

-- Comentários
COMMENT ON TABLE public.uapi_sessions IS 'Sessões UAPI Lalamove - tokens e credenciais para integração com br-uapi.lalamove.com';
COMMENT ON COLUMN public.uapi_sessions.token IS 'Token de autenticação passado como query param nas requests UAPI';
COMMENT ON COLUMN public.uapi_sessions.x_sign_js IS 'Header x-sign-js - pode mudar por sessão';
COMMENT ON COLUMN public.uapi_sessions.x_javascript_fingerprinting IS 'Header de fingerprinting do browser';
