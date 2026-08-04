
-- Tabela para armazenar resultados do módulo Lux
CREATE TABLE public.lux_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company')),
  entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  request_type text NOT NULL DEFAULT 'full_scan',
  
  -- Dados gerais coletados
  social_profiles jsonb DEFAULT '[]'::jsonb,
  social_analysis jsonb DEFAULT '{}'::jsonb,
  
  -- Empresa: dados fiscais (Receita Federal)
  fiscal_data jsonb DEFAULT '{}'::jsonb,
  
  -- Empresa: stakeholders encontrados
  stakeholders jsonb DEFAULT '[]'::jsonb,
  
  -- Empresa: análise de público-alvo e comunicação
  audience_analysis jsonb DEFAULT '{}'::jsonb,
  
  -- Contato: perfil pessoal completo
  personal_profile jsonb DEFAULT '{}'::jsonb,
  
  -- Relatório completo gerado pela IA
  ai_report text,
  ai_summary text,
  
  -- Campos existentes preenchidos automaticamente
  fields_updated jsonb DEFAULT '[]'::jsonb,
  
  -- Metadados
  error_message text,
  n8n_execution_id text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.lux_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lux intelligence"
  ON public.lux_intelligence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lux intelligence"
  ON public.lux_intelligence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lux intelligence"
  ON public.lux_intelligence FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lux intelligence"
  ON public.lux_intelligence FOR DELETE
  USING (auth.uid() = user_id);

-- Service role pode atualizar (para o webhook do n8n)
CREATE POLICY "Service role can update lux intelligence"
  ON public.lux_intelligence FOR UPDATE
  USING (true)
  WITH CHECK (true);
