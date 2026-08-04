-- Table for contact cadence settings (frequency of contact)
CREATE TABLE public.contact_cadence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  cadence_days INTEGER NOT NULL DEFAULT 14,
  priority VARCHAR(20) DEFAULT 'medium',
  auto_remind BOOLEAN DEFAULT true,
  last_contact_at TIMESTAMPTZ,
  next_contact_due TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_cadence ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own contact cadence" 
ON public.contact_cadence FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact cadence" 
ON public.contact_cadence FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact cadence" 
ON public.contact_cadence FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact cadence" 
ON public.contact_cadence FOR DELETE USING (auth.uid() = user_id);

-- Table for contact preferences and restrictions
CREATE TABLE public.contact_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  preferred_channel VARCHAR(50) DEFAULT 'whatsapp',
  preferred_days TEXT[] DEFAULT '{}',
  preferred_times TEXT[] DEFAULT '{}',
  avoid_days TEXT[] DEFAULT '{}',
  avoid_times TEXT[] DEFAULT '{}',
  restrictions TEXT,
  personal_notes TEXT,
  communication_tips TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.contact_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own contact preferences" 
ON public.contact_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact preferences" 
ON public.contact_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact preferences" 
ON public.contact_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact preferences" 
ON public.contact_preferences FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_contact_cadence_updated_at
BEFORE UPDATE ON public.contact_cadence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_preferences_updated_at
BEFORE UPDATE ON public.contact_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();