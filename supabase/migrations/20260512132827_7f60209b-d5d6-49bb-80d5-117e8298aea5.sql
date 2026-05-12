-- Adicionar colunas para transcrição em interactions
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS transcription_metadata JSONB DEFAULT '{}'::jsonb;

-- Criar tabela para perfil analítico
CREATE TABLE IF NOT EXISTS public.contact_analytical_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    preferences JSONB DEFAULT '[]'::jsonb, -- ['comunicação rápida', 'detalhista', 'prefere áudio']
    recurrent_topics JSONB DEFAULT '[]'::jsonb, -- ['preço', 'integração', 'prazo']
    communication_style TEXT, -- 'direto', 'analítico', 'amigável'
    sentiment_trend TEXT, -- 'melhorando', 'estável', 'em risco'
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contact_analytical_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytical profiles of their contacts" 
ON public.contact_analytical_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage analytical profiles of their contacts" 
ON public.contact_analytical_profiles FOR ALL 
USING (auth.uid() = user_id);

-- Tabela de resumos unificados
CREATE TABLE IF NOT EXISTS public.interaction_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    summary TEXT,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    next_steps TEXT,
    negotiation_stage_summary TEXT,
    last_interaction_id UUID REFERENCES public.interactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.interaction_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view summaries of their entities" 
ON public.interaction_summaries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage summaries of their entities" 
ON public.interaction_summaries FOR ALL 
USING (auth.uid() = user_id);

-- Trigger para atualizar timestamps em interaction_summaries
CREATE TRIGGER update_interaction_summaries_updated_at
BEFORE UPDATE ON public.interaction_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
