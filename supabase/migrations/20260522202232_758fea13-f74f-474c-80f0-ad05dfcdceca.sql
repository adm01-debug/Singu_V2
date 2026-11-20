-- Create tone preferences table
CREATE TABLE IF NOT EXISTS public.ai_tone_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    preferred_tone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.ai_tone_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can manage their own tone preferences" ON public.ai_tone_preferences;  -- [singu-idem]
CREATE POLICY "Users can manage their own tone preferences"
ON public.ai_tone_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_tone_prefs_user_company ON public.ai_tone_preferences(user_id, company_id);

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_ai_tone_preferences_updated_at ON public.ai_tone_preferences;  -- [singu-idem]
CREATE TRIGGER update_ai_tone_preferences_updated_at
BEFORE UPDATE ON public.ai_tone_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();