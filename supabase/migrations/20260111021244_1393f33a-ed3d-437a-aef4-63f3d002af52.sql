-- Add NLP profile field to profiles table for salesperson profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nlp_profile jsonb DEFAULT '{
  "vakProfile": null,
  "discProfile": null,
  "metaprograms": {
    "motivationDirection": null,
    "referenceFrame": null,
    "workingStyle": null,
    "chunkSize": null,
    "actionFilter": null,
    "comparisonStyle": null
  }
}'::jsonb;

-- Add comment describing the field
COMMENT ON COLUMN public.profiles.nlp_profile IS 'Stores the salesperson NLP profile including VAK, DISC and Metaprograms for compatibility scoring';