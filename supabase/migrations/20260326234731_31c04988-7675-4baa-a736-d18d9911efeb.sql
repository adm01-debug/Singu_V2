ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS cnpj_base text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS nome_crm text,
  ADD COLUMN IF NOT EXISTS nicho_cliente text,
  ADD COLUMN IF NOT EXISTS ramo_atividade text,
  ADD COLUMN IF NOT EXISTS capital_social numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS situacao_rf text,
  ADD COLUMN IF NOT EXISTS situacao_rf_data date,
  ADD COLUMN IF NOT EXISTS porte_rf text,
  ADD COLUMN IF NOT EXISTS natureza_juridica text,
  ADD COLUMN IF NOT EXISTS natureza_juridica_desc text,
  ADD COLUMN IF NOT EXISTS data_fundacao date,
  ADD COLUMN IF NOT EXISTS grupo_economico text,
  ADD COLUMN IF NOT EXISTS grupo_economico_id uuid,
  ADD COLUMN IF NOT EXISTS is_customer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_supplier boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_carrier boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_matriz boolean,
  ADD COLUMN IF NOT EXISTS matriz_id uuid,
  ADD COLUMN IF NOT EXISTS tipo_cooperativa text,
  ADD COLUMN IF NOT EXISTS numero_cooperativa text,
  ADD COLUMN IF NOT EXISTS singular_id uuid,
  ADD COLUMN IF NOT EXISTS central_id uuid,
  ADD COLUMN IF NOT EXISTS confederacao_id uuid,
  ADD COLUMN IF NOT EXISTS inscricao_estadual text,
  ADD COLUMN IF NOT EXISTS inscricao_municipal text,
  ADD COLUMN IF NOT EXISTS cores_marca text,
  ADD COLUMN IF NOT EXISTS extra_data_rf jsonb,
  ADD COLUMN IF NOT EXISTS bitrix_company_id integer,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies (cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj_base ON public.companies (cnpj_base);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies (status);
CREATE INDEX IF NOT EXISTS idx_companies_grupo_economico ON public.companies (grupo_economico);
CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON public.companies USING gin (search_vector);