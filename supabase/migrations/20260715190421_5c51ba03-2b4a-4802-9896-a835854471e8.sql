
-- system_config: key/value numérico para thresholds runtime-configuráveis
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value NUMERIC NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.system_config TO authenticated;
GRANT ALL ON public.system_config TO service_role;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated reads system_config"
  ON public.system_config FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage system_config"
  ON public.system_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_system_config()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS system_config_touch ON public.system_config;
CREATE TRIGGER system_config_touch
BEFORE UPDATE ON public.system_config
FOR EACH ROW EXECUTE FUNCTION public.touch_system_config();

-- Seed threshold padrão de SLA MTTA crítico (minutos)
INSERT INTO public.system_config (key, value, description)
VALUES ('mtta_critical_sla_min', 30, 'SLA alvo para MTTA de alertas críticos (minutos)')
ON CONFLICT (key) DO NOTHING;

-- Helper para leitura segura com fallback
CREATE OR REPLACE FUNCTION public.get_system_config_num(_key TEXT, _default NUMERIC)
RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT value FROM public.system_config WHERE key = _key), _default);
$$;

REVOKE ALL ON FUNCTION public.get_system_config_num(TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_system_config_num(TEXT, NUMERIC) TO authenticated, service_role;
