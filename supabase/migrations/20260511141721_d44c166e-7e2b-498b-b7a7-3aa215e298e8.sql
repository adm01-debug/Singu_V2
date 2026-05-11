-- 1. Restrição de Tipos de Eventos
ALTER TABLE public.life_events DROP CONSTRAINT IF EXISTS life_events_type_check;
ALTER TABLE public.life_events ADD CONSTRAINT life_events_type_check 
CHECK (event_type IN ('birthday', 'anniversary', 'promotion', 'travel', 'family', 'achievement', 'other'));

-- 2. Trigger de Auditoria
DROP TRIGGER IF EXISTS tr_audit_life_events ON public.life_events;
CREATE TRIGGER tr_audit_life_events
AFTER INSERT OR UPDATE OR DELETE ON public.life_events
FOR EACH ROW EXECUTE FUNCTION public.audit_life_events();

-- 3. Trigger de Timestamp (Garantia)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.life_events;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.life_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Melhoria de RLS na Tabela de Histórico
ALTER TABLE public.life_events_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own life events history" ON public.life_events_history;
CREATE POLICY "Users can view their own life events history"
ON public.life_events_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
