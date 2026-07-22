-- Audit log table
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by entity
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log (user_id, created_at DESC);

-- RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach to contacts
CREATE TRIGGER audit_contacts
AFTER INSERT OR UPDATE OR DELETE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Attach to companies
CREATE TRIGGER audit_companies
AFTER INSERT OR UPDATE OR DELETE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- Attach to interactions
CREATE TRIGGER audit_interactions
AFTER INSERT OR UPDATE OR DELETE ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();