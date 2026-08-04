ALTER TABLE public.contact_behavior 
ADD COLUMN IF NOT EXISTS vak_visual INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vak_auditory INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vak_kinesthetic INTEGER DEFAULT 0;

-- Update RLS (though usually not needed if already enabled for the table)
-- Assuming contact_behavior already has RLS based on owner/permissions.
