-- Adding version column to contacts if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='version') THEN
    ALTER TABLE public.contacts ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Create follow_up_approvals_v2 table for the AI approval feature
CREATE TABLE IF NOT EXISTS public.follow_up_approvals_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for follow_up_approvals_v2
ALTER TABLE public.follow_up_approvals_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own follow-up approvals"
ON public.follow_up_approvals_v2
FOR ALL
USING (auth.uid() = user_id);

-- Performance indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_contacts_rel_score_updated ON public.contacts (relationship_score DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id_created ON public.interactions (contact_id, created_at DESC);