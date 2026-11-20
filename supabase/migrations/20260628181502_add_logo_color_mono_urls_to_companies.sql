-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260628181502
-- nome:   add_logo_color_mono_urls_to_companies

-- Logo em alta resolução por empresa (Cloudflare Images) para o Gerador de Mockup.
-- Duas variantes: colorida (técnicas full-color) e mono/1 cor (laser, gravação 1 cor).
-- Distintas da logo_url legada (baixa resolução, usada só no avatar do seletor).
-- fix_version: 2026-06-28 logo-hi-res

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_color_url text,
  ADD COLUMN IF NOT EXISTS logo_mono_url  text;

COMMENT ON COLUMN public.companies.logo_color_url IS
  'URL da logo COLORIDA em alta resolução (Cloudflare Images). Consumida pelo Gerador de Mockup (default) e exportações. Distinta de logo_url (baixa res, só avatar). fix_version: 2026-06-28 logo-hi-res';

COMMENT ON COLUMN public.companies.logo_mono_url IS
  'URL da logo MONOCROMATICA / 1 cor em alta resolução (Cloudflare Images). Consumida pelo Gerador de Mockup em tecnicas mono (laser, gravacao 1 cor). fix_version: 2026-06-28 logo-hi-res';
