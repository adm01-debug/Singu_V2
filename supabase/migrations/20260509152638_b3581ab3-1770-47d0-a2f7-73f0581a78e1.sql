-- Table for suggested rapport info (approval flow)
CREATE TABLE IF NOT EXISTS public.suggested_rapport_intel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hobby', 'interest')),
  value TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('whatsapp', 'call', 'linkedin', 'instagram', 'twitter', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for family info history (versioning)
CREATE TABLE IF NOT EXISTS public.contact_family_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  family_info TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.suggested_rapport_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_family_history ENABLE ROW LEVEL SECURITY;

-- Policies for suggested_rapport_intel
CREATE POLICY "Users can view suggested rapport for their contacts"
ON public.suggested_rapport_intel
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id));

CREATE POLICY "Users can update status of suggested rapport"
ON public.suggested_rapport_intel
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id));

CREATE POLICY "System/Users can insert suggested rapport"
ON public.suggested_rapport_intel
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id));

-- Policies for contact_family_history
CREATE POLICY "Users can view family history for their contacts"
ON public.contact_family_history
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id));

CREATE POLICY "Users can insert family history"
ON public.contact_family_history
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_suggested_rapport_updated_at
BEFORE UPDATE ON public.suggested_rapport_intel
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically save family history on contact update
CREATE OR REPLACE FUNCTION public.save_contact_family_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.family_info IS DISTINCT FROM NEW.family_info) THEN
    INSERT INTO public.contact_family_history (contact_id, family_info, changed_by)
    VALUES (NEW.id, OLD.family_info, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_contact_family_history_versioning
AFTER UPDATE OF family_info ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.save_contact_family_history();
