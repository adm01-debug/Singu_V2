-- Tabela de Pipelines
CREATE TABLE public.pipelines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Estágios do Pipeline
CREATE TABLE public.pipeline_stages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    probability INTEGER DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Oportunidades (Deals)
CREATE TABLE public.deals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    value NUMERIC(15, 2) DEFAULT 0,
    probability INTEGER DEFAULT 10,
    expected_closing_date DATE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'on_hold')),
    loss_reason TEXT,
    notes TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Políticas para Pipelines
CREATE POLICY "Users can view their own pipelines" ON public.pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pipelines" ON public.pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pipelines" ON public.pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pipelines" ON public.pipelines FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Estágios (baseadas no pipeline pai)
CREATE POLICY "Users can view stages of their pipelines" ON public.pipeline_stages 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can manage stages of their pipelines" ON public.pipeline_stages 
FOR ALL USING (EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_id AND p.user_id = auth.uid()));

-- Políticas para Deals
CREATE POLICY "Users can view their own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deals" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deals" ON public.deals FOR DELETE USING (auth.uid() = user_id);

-- Triggers para Updated At
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir Pipeline Padrão e Estágios para novos usuários via função (opcional, faremos via código por agora para flexibilidade)
