-- Create table for allowed transitions with explicit UNIQUE constraint
CREATE TABLE IF NOT EXISTS public.pipeline_stage_transitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_stage TEXT NOT NULL,
    to_stage TEXT NOT NULL,
    is_allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure unique constraint exists for ON CONFLICT
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pipeline_stage_transitions_from_to_idx') THEN
        ALTER TABLE public.pipeline_stage_transitions ADD CONSTRAINT pipeline_stage_transitions_from_to_idx UNIQUE (from_stage, to_stage);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.pipeline_stage_transitions ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Transitions are viewable by everyone authenticated') THEN
        CREATE POLICY "Transitions are viewable by everyone authenticated" 
        ON public.pipeline_stage_transitions FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Populate default allowed transitions
INSERT INTO public.pipeline_stage_transitions (from_stage, to_stage)
VALUES 
    ('lead', 'prospect'),
    ('lead', 'ed'),
    ('prospect', 'qualified'),
    ('prospect', 'ed'),
    ('qualified', 'proposal'),
    ('qualified', 'ed'),
    ('proposal', 'negotiation'),
    ('proposal', 'ed'),
    ('negotiation', 'customer'),
    ('negotiation', 'proposal'),
    ('negotiation', 'ed')
ON CONFLICT (from_stage, to_stage) DO NOTHING;

-- Create atomic move function with validation
CREATE OR REPLACE FUNCTION public.move_deal_atomic(
    p_deal_id UUID,
    p_new_stage TEXT,
    p_new_probability NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_stage TEXT;
    v_is_allowed BOOLEAN;
    v_result JSONB;
BEGIN
    -- 1. Get current state
    SELECT pipeline_stage INTO v_current_stage FROM public.deals WHERE id = p_deal_id;
    
    IF v_current_stage IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Deal not found');
    END IF;

    -- 2. Validate transition
    SELECT is_allowed INTO v_is_allowed 
    FROM public.pipeline_stage_transitions 
    WHERE from_stage = v_current_stage AND to_stage = p_new_stage;

    IF v_is_allowed IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', format('Transition from %s to %s is not allowed.', v_current_stage, p_new_stage));
    END IF;

    -- 3. Perform update
    UPDATE public.deals
    SET 
        pipeline_stage = p_new_stage,
        probabilidade = COALESCE(p_new_probability, probabilidade),
        updated_at = now()
    WHERE id = p_deal_id;

    -- 4. Audit entry (only if audit_log exists)
    BEGIN
        INSERT INTO public.audit_log (
            entity_type, 
            entity_id, 
            action, 
            old_data, 
            new_data, 
            user_id
        ) VALUES (
            'deal',
            p_deal_id,
            'move_stage',
            jsonb_build_object('stage', v_current_stage),
            jsonb_build_object('stage', p_new_stage),
            auth.uid()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Fallback if audit_log table doesn't exist or has different schema
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'deal_id', p_deal_id,
        'from', v_current_stage,
        'to', p_new_stage
    );
END;
$$;