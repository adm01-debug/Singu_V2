-- Populate disc_profile_config with standard data
INSERT INTO public.disc_profile_config (
    profile_type, name, short_description, detailed_description, 
    core_drive, core_fear, under_pressure, ideal_environment,
    communication_style, preferred_pace, decision_making_style,
    icon, color_scheme
) VALUES 
(
    'D', 'Dominância', 'Direto, decisivo, focado em resultados', 
    'Pessoas com perfil Dominante são assertivas, competitivas e voltadas para resultados rápidos.',
    'Resultados e Controle', 'Perder o controle e parecer vulnerável', 
    'Torna-se impaciente e autoritário', 'Ambiente desafiador com autonomia',
    '{"pace": "fast", "focus": "task", "format": "direto"}', 'Rápido', 'Rápido e independente',
    'zap', '{"primary": "hsl(0, 84%, 60%)", "bg": "bg-destructive/5"}'
),
(
    'I', 'Influência', 'Entusiasta, otimista, focado em pessoas', 
    'Pessoas com perfil Influente são comunicativas, entusiasmadas e valorizam relacionamentos.',
    'Reconhecimento e Conexão', 'Rejeição social e isolamento', 
    'Torna-se desorganizado e emocional', 'Ambiente social e criativo',
    '{"pace": "fast", "focus": "people", "format": "entusiasmado"}', 'Rápido', 'Impulsivo e intuitivo',
    'sparkles', '{"primary": "hsl(48, 96%, 53%)", "bg": "bg-warning/5"}'
),
(
    'S', 'Estabilidade', 'Paciente, confiável, focado em segurança', 
    'Pessoas com perfil Estável são leais, calmas e valorizam a harmonia e processos claros.',
    'Segurança e Harmonia', 'Mudanças bruscas e conflitos', 
    'Torna-se passivo e indeciso', 'Ambiente previsível e colaborativo',
    '{"pace": "slow", "focus": "harmony", "format": "calmo"}', 'Moderado', 'Lento e consensual',
    'shield', '{"primary": "hsl(142, 71%, 45%)", "bg": "bg-success/5"}'
),
(
    'C', 'Conformidade', 'Analítico, preciso, focado em qualidade', 
    'Pessoas com perfil Conforme são detalhistas, lógicas e valorizam a precisão e dados.',
    'Qualidade e Precisão', 'Cometer erros e críticas públicas', 
    'Torna-se excessivamente crítico e retraído', 'Ambiente organizado e fundamentado',
    '{"pace": "moderate", "focus": "data", "format": "detalhado"}', 'Lento', 'Analítico e cauteloso',
    'bar-chart', '{"primary": "hsl(217, 91%, 60%)", "bg": "bg-info/5"}'
) ON CONFLICT (profile_type) DO NOTHING;

-- Create audit table for DISC analysis
CREATE TABLE IF NOT EXISTS public.disc_analysis_history_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    user_id UUID NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.disc_analysis_history_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own DISC audit" ON public.disc_analysis_history_audit
    FOR SELECT USING (auth.uid() = user_id);

-- Audit function for DISC
CREATE OR REPLACE FUNCTION public.process_disc_analysis_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.disc_analysis_history_audit (analysis_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.disc_analysis_history_audit (analysis_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.disc_analysis_history_audit (analysis_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for DISC analysis
CREATE OR REPLACE TRIGGER on_disc_analysis_change
AFTER INSERT OR UPDATE OR DELETE ON public.disc_analysis_history
FOR EACH ROW EXECUTE FUNCTION public.process_disc_analysis_audit();