-- Adicionar colunas para Roadmap Preditivo
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS predictive_roadmap JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS future_needs_forecast JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS strategic_roadmap JSONB DEFAULT '[]'::jsonb;

-- Tabela para Tratamento Inteligente de Objeções
CREATE TABLE IF NOT EXISTS public.crm_objection_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    objection_type TEXT NOT NULL,
    behavioral_profile TEXT, -- Dominante, Influente, Estável, Analítico
    suggested_strategy TEXT,
    script_content TEXT,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.crm_objection_intelligence ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Usuários podem ver inteligência de objeções"
ON public.crm_objection_intelligence FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem gerenciar inteligência de objeções"
ON public.crm_objection_intelligence FOR ALL
USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_crm_objection_intelligence_updated_at
BEFORE UPDATE ON public.crm_objection_intelligence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_objection_contact_id ON public.crm_objection_intelligence(contact_id);
CREATE INDEX IF NOT EXISTS idx_objection_type ON public.crm_objection_intelligence(objection_type);
