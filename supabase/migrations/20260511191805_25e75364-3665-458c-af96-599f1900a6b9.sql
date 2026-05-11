ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS reference_frame TEXT,
ADD COLUMN IF NOT EXISTS chunk_size TEXT,
ADD COLUMN IF NOT EXISTS action_filter TEXT,
ADD COLUMN IF NOT EXISTS comparison_style TEXT,
ADD COLUMN IF NOT EXISTS most_frequent_objection TEXT;

-- Create an index for these for better filtering performance
CREATE INDEX IF NOT EXISTS idx_contacts_nlp_behavior ON public.contacts (vak_dominant, motivation_direction, working_style, reference_frame);
