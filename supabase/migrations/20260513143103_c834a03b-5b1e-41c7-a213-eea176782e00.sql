-- Tabela de transições permitidas
CREATE TABLE public.pipeline_stage_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
    to_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
    is_allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(pipeline_id, from_stage_id, to_stage_id)
);

-- Habilitar RLS
ALTER TABLE public.pipeline_stage_transitions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir leitura de transições para todos os usuários autenticados"
ON public.pipeline_stage_transitions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem gerenciar transições"
ON public.pipeline_stage_transitions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Função para validar a transição no trigger
CREATE OR REPLACE FUNCTION public.fn_validate_deal_stage_transition()
RETURNS TRIGGER AS $$
DECLARE
    transition_record RECORD;
BEGIN
    -- Se o estágio não mudou, ok
    IF (OLD.stage_id IS NOT DISTINCT FROM NEW.stage_id) THEN
        RETURN NEW;
    END IF;

    -- Se OLD.stage_id é NULL (novo deal), ok
    IF (OLD.stage_id IS NULL) THEN
        RETURN NEW;
    END IF;

    -- Verificar se existe uma regra explícita para esta transição
    SELECT * INTO transition_record 
    FROM public.pipeline_stage_transitions 
    WHERE pipeline_id = NEW.pipeline_id 
      AND from_stage_id = OLD.stage_id 
      AND to_stage_id = NEW.stage_id;

    -- Se a regra existe e is_allowed é false, bloqueia
    IF FOUND AND transition_record.is_allowed = false THEN
        RAISE EXCEPTION 'Transição de estágio não permitida: de % para %', OLD.stage_id, NEW.stage_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela deals
CREATE TRIGGER tr_validate_deal_stage_transition
BEFORE UPDATE OF stage_id ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_deal_stage_transition();
