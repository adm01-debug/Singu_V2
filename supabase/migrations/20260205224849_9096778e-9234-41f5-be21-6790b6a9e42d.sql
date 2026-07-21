
-- Tabela para parentes/familiares dos contatos
CREATE TABLE public.contact_relatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- 'mother', 'father', 'spouse', 'child', 'sibling', 'grandparent', 'uncle_aunt', 'cousin', 'in_law', 'other'
  age INTEGER,
  birthday DATE,
  phone TEXT,
  email TEXT,
  occupation TEXT,
  company TEXT,
  notes TEXT,
  is_decision_influencer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contact_relatives_user_id ON public.contact_relatives(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_relatives_contact_id ON public.contact_relatives(contact_id);

-- RLS
ALTER TABLE public.contact_relatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact_relatives"
  ON public.contact_relatives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact_relatives"
  ON public.contact_relatives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact_relatives"
  ON public.contact_relatives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact_relatives"
  ON public.contact_relatives FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_contact_relatives_updated_at
  BEFORE UPDATE ON public.contact_relatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
