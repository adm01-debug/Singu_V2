-- This migration ensures metadata structure supports tracking specific insight IDs
-- No structural table changes needed as metadata is JSONB, but adding comments/documentation

COMMENT ON COLUMN public.offer_suggestions.metadata IS 'Armazena detalhes do match social, incluindo sources, keywords e social_insight_ids vinculados.';

-- Update the generator function logic (SQL representation for clarity, logic applied in Edge Function)
-- Logic to be applied: When a keyword match occurs, collect the ID of the social_insight that provided that keyword.
