-- Table for suggested rapport intel (approval flow)
CREATE TABLE public.suggested_rapport_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('hobby', 'interest')),
    value TEXT NOT NULL,
    source TEXT NOT NULL, -- 'whatsapp', 'call', 'linkedin', 'instagram', 'twitter'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for contact family history (versioning)
CREATE TABLE public.contact_family_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    family_info TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggested_rapport_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_family_history ENABLE ROW LEVEL SECURITY;

-- Policies for suggested_rapport_intel
CREATE POLICY "Users can manage their suggested rapport"
ON public.suggested_rapport_intel
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for contact_family_history
CREATE POLICY "Users can view their contact family history"
ON public.contact_family_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their contact family history"
ON public.contact_family_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to automatically record family history changes
CREATE OR REPLACE FUNCTION public.record_family_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.family_info IS DISTINCT FROM NEW.family_info) THEN
            INSERT INTO public.contact_family_history (contact_id, user_id, family_info, changed_at)
            VALUES (NEW.id, NEW.user_id, NEW.family_info, now());
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        IF (NEW.family_info IS NOT NULL) THEN
            INSERT INTO public.contact_family_history (contact_id, user_id, family_info, changed_at)
            VALUES (NEW.id, NEW.user_id, NEW.family_info, now());
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on contacts table
CREATE TRIGGER trg_record_family_history
AFTER INSERT OR UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.record_family_history();

-- Trigger for updated_at on suggested_rapport_intel
CREATE TRIGGER update_suggested_rapport_updated_at
BEFORE UPDATE ON public.suggested_rapport_intel
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_suggested_rapport_contact ON public.suggested_rapport_intel(contact_id, status);
CREATE INDEX idx_contact_family_history_contact ON public.contact_family_history(contact_id, changed_at DESC);