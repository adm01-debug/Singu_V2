-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260319185913
-- nome:   create_pix_accounts_table

-- =============================================
-- TABELA: pix_accounts
-- Chaves PIX de empresas (fornecedores, transportadoras, etc.)
-- =============================================

CREATE TABLE public.pix_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  pix_tipo        TEXT NOT NULL CHECK (pix_tipo IN ('cnpj','cpf','email','telefone','aleatoria')),
  pix_chave       TEXT NOT NULL,
  pix_favorecido  TEXT,

  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX  idx_pix_company     ON public.pix_accounts(company_id);
CREATE INDEX  idx_pix_active      ON public.pix_accounts(company_id) WHERE is_active = true;
CREATE UNIQUE INDEX uq_pix_chave_ativa 
  ON public.pix_accounts(company_id, pix_chave) WHERE is_active = true;

-- Trigger updated_at automático
CREATE OR REPLACE FUNCTION public.trg_pix_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pix_accounts_set_updated_at
  BEFORE UPDATE ON public.pix_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trg_pix_accounts_updated_at();

-- RLS
ALTER TABLE public.pix_accounts ENABLE ROW LEVEL SECURITY;

-- View com dados da empresa
CREATE OR REPLACE VIEW public.vw_pix_accounts AS
SELECT
  p.id AS pix_id,
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
FROM public.pix_accounts p
JOIN public.companies c ON c.id = p.company_id;
