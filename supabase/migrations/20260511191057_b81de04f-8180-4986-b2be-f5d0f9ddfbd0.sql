-- Add cache columns to contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS vak_dominant TEXT,
ADD COLUMN IF NOT EXISTS motivation_direction TEXT,
ADD COLUMN IF NOT EXISTS working_style TEXT;

-- Create function to sync NLP data to contacts
CREATE OR REPLACE FUNCTION public.sync_nlp_to_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_TABLE_NAME = 'vak_analysis_history') THEN
        -- Calculate dominant system
        UPDATE public.contacts 
        SET vak_dominant = CASE 
            WHEN NEW.visual_score >= GREATEST(NEW.auditory_score, NEW.kinesthetic_score, NEW.digital_score) THEN 'V'
            WHEN NEW.auditory_score >= GREATEST(NEW.visual_score, NEW.kinesthetic_score, NEW.digital_score) THEN 'A'
            WHEN NEW.kinesthetic_score >= GREATEST(NEW.visual_score, NEW.auditory_score, NEW.digital_score) THEN 'K'
            ELSE 'D'
        END
        WHERE id = NEW.contact_id;
    ELSIF (TG_TABLE_NAME = 'metaprogram_analysis') THEN
        UPDATE public.contacts 
        SET 
            motivation_direction = CASE 
                WHEN NEW.toward_score > NEW.away_from_score THEN 'toward' 
                WHEN NEW.away_from_score > NEW.toward_score THEN 'away_from' 
                ELSE 'balanced' 
            END,
            working_style = CASE 
                WHEN NEW.options_score > NEW.procedures_score THEN 'options' 
                WHEN NEW.procedures_score > NEW.options_score THEN 'procedures' 
                ELSE 'balanced' 
            END
        WHERE id = NEW.contact_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS tr_sync_vak_to_contact ON public.vak_analysis_history;
CREATE TRIGGER tr_sync_vak_to_contact
AFTER INSERT OR UPDATE ON public.vak_analysis_history
FOR EACH ROW EXECUTE FUNCTION public.sync_nlp_to_contact();

DROP TRIGGER IF EXISTS tr_sync_meta_to_contact ON public.metaprogram_analysis;
CREATE TRIGGER tr_sync_meta_to_contact
AFTER INSERT OR UPDATE ON public.metaprogram_analysis
FOR EACH ROW EXECUTE FUNCTION public.sync_nlp_to_contact();

-- Backfill existing data
UPDATE public.contacts c
SET 
    vak_dominant = (
        SELECT CASE 
            WHEN v.visual_score >= GREATEST(v.auditory_score, v.kinesthetic_score, v.digital_score) THEN 'V'
            WHEN v.auditory_score >= GREATEST(v.visual_score, v.kinesthetic_score, v.digital_score) THEN 'A'
            WHEN v.kinesthetic_score >= GREATEST(v.visual_score, v.auditory_score, v.digital_score) THEN 'K'
            ELSE 'D'
        END
        FROM public.vak_analysis_history v
        WHERE v.contact_id = c.id
        ORDER BY v.created_at DESC LIMIT 1
    ),
    motivation_direction = (
        SELECT CASE 
            WHEN m.toward_score > m.away_from_score THEN 'toward' 
            WHEN m.away_from_score > m.toward_score THEN 'away_from' 
            ELSE 'balanced' 
        END
        FROM public.metaprogram_analysis m
        WHERE m.contact_id = c.id
        ORDER BY m.created_at DESC LIMIT 1
    ),
    working_style = (
        SELECT CASE 
            WHEN m.options_score > m.procedures_score THEN 'options' 
            WHEN m.procedures_score > m.options_score THEN 'procedures' 
            ELSE 'balanced' 
        END
        FROM public.metaprogram_analysis m
        WHERE m.contact_id = c.id
        ORDER BY m.created_at DESC LIMIT 1
    );
