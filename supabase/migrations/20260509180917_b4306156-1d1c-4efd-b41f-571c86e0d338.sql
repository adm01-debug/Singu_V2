-- Tabela de logs de auditoria detalhados de relacionamento
CREATE TABLE IF NOT EXISTS public.crm_relationship_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL, -- 'score', 'stage', 'sentiment', 'last_contact', 'interactions_count'
    old_value TEXT,
    new_value TEXT,
    change_source TEXT NOT NULL, -- 'automation', 'manual', 'webhook'
    trigger_name TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.crm_relationship_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own relationship audit logs" 
ON public.crm_relationship_audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Trigger para capturar mudanças automaticamente
CREATE OR REPLACE FUNCTION public.log_contact_relationship_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log Score Change
    IF (OLD.relationship_score IS DISTINCT FROM NEW.relationship_score) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'score', OLD.relationship_score::text, NEW.relationship_score::text, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Atualização de score detectada');
    END IF;

    -- Log Stage Change
    IF (OLD.relationship_stage IS DISTINCT FROM NEW.relationship_stage) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'stage', OLD.relationship_stage, NEW.relationship_stage, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Mudança de estágio do funil');
    END IF;

    -- Log Sentiment Change
    IF (OLD.sentiment IS DISTINCT FROM NEW.sentiment) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'sentiment', OLD.sentiment, NEW.sentiment, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Análise de sentimento atualizada');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_contact_relationship_changes
AFTER UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.log_contact_relationship_changes();

-- Função de Validação de Consistência
CREATE OR REPLACE FUNCTION public.check_relationship_consistency(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_contact RECORD;
    v_int_count INTEGER;
    v_last_int TIMESTAMP WITH TIME ZONE;
    v_issues JSONB := '[]'::jsonb;
BEGIN
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
    
    -- Verificar contagem de interações
    SELECT count(*), max(created_at) INTO v_int_count, v_last_int
    FROM public.interactions WHERE contact_id = p_contact_id;
    
    IF v_contact.interactions_count != v_int_count THEN
        v_issues := v_issues || jsonb_build_object(
            'type', 'count_mismatch',
            'expected', v_int_count,
            'actual', v_contact.interactions_count
        );
    END IF;
    
    IF v_contact.last_interaction_at IS DISTINCT FROM v_last_int THEN
        v_issues := v_issues || jsonb_build_object(
            'type', 'last_contact_mismatch',
            'expected', v_last_int,
            'actual', v_contact.last_interaction_at
        );
    END IF;

    RETURN jsonb_build_object(
        'contact_id', p_contact_id,
        'consistent', jsonb_array_length(v_issues) = 0,
        'issues', v_issues,
        'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql;
