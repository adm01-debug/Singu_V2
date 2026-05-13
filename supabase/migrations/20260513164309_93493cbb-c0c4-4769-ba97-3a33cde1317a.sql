-- Garantir que a tabela existe com as colunas corretas
DROP TABLE IF EXISTS public.pipeline_stage_transitions;

CREATE TABLE public.pipeline_stage_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_stage TEXT NOT NULL,
    to_stage TEXT NOT NULL,
    allowed BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pipeline_stage_transitions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Leitura pública de transições" ON public.pipeline_stage_transitions
    FOR SELECT USING (true);

-- Popular transições básicas
INSERT INTO public.pipeline_stage_transitions (from_stage, to_stage)
VALUES 
    ('lead', 'primeiro_contato'),
    ('primeiro_contato', 'qualificacao'),
    ('qualificacao', 'proposta'),
    ('proposta', 'negociacao'),
    ('negociacao', 'fechamento'),
    ('fechamento', 'lead');

-- Função atômica para mover deals
CREATE OR REPLACE FUNCTION public.move_deal_atomic(
    p_deal_id UUID,
    p_new_stage TEXT,
    p_new_probability INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_stage TEXT;
    v_is_allowed BOOLEAN;
BEGIN
    -- Obter estágio atual (checa se deal existe)
    SELECT pipeline_stage INTO v_old_stage FROM public.deals WHERE id = p_deal_id;
    
    IF v_old_stage IS NULL THEN
        RAISE EXCEPTION 'Deal não encontrado: %', p_deal_id;
    END IF;
    
    -- Validar se transição é permitida
    SELECT allowed INTO v_is_allowed 
    FROM public.pipeline_stage_transitions 
    WHERE from_stage = v_old_stage AND to_stage = p_new_stage;
    
    -- Se não existir na tabela, permitimos por padrão (flexibilidade), 
    -- mas se existir e for allowed=false, bloqueamos.
    IF v_is_allowed IS FALSE THEN
        RAISE EXCEPTION 'Transição de % para % não permitida por política de negócio', v_old_stage, p_new_stage;
    END IF;

    -- Update atômico
    UPDATE public.deals
    SET 
        pipeline_stage = p_new_stage,
        probabilidade = COALESCE(p_new_probability, probabilidade),
        updated_at = now()
    WHERE id = p_deal_id;

    -- Registrar auditoria se a tabela existir
    BEGIN
        INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, new_data)
        VALUES ('deal', p_deal_id, 'move_stage', jsonb_build_object('stage', v_old_stage), jsonb_build_object('stage', p_new_stage));
    EXCEPTION WHEN OTHERS THEN
        -- Ignora se audit_log não existir ou falhar
    END;

    RETURN jsonb_build_object('success', true, 'deal_id', p_deal_id, 'from', v_old_stage, 'to', p_new_stage);
END;
$$;