-- Add NLP columns to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS vak_dominant TEXT,
ADD COLUMN IF NOT EXISTS motivation_direction TEXT,
ADD COLUMN IF NOT EXISTS working_style TEXT;

-- Function to aggregate NLP data from contacts to company
CREATE OR REPLACE FUNCTION public.aggregate_nlp_to_company(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.companies
    SET 
        vak_dominant = (
            SELECT vak_dominant
            FROM public.contacts
            WHERE company_id = p_company_id AND vak_dominant IS NOT NULL
            GROUP BY vak_dominant
            ORDER BY COUNT(*) DESC, vak_dominant ASC
            LIMIT 1
        ),
        motivation_direction = (
            SELECT motivation_direction
            FROM public.contacts
            WHERE company_id = p_company_id AND motivation_direction IS NOT NULL
            GROUP BY motivation_direction
            ORDER BY COUNT(*) DESC, motivation_direction ASC
            LIMIT 1
        ),
        working_style = (
            SELECT working_style
            FROM public.contacts
            WHERE company_id = p_company_id AND working_style IS NOT NULL
            GROUP BY working_style
            ORDER BY COUNT(*) DESC, working_style ASC
            LIMIT 1
        )
    WHERE id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to re-aggregate when a contact's NLP data changes
CREATE OR REPLACE FUNCTION public.trigger_aggregate_nlp_to_company()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.company_id IS NOT NULL) THEN
        PERFORM public.aggregate_nlp_to_company(NEW.company_id);
    END IF;
    IF (OLD.company_id IS NOT NULL AND OLD.company_id != COALESCE(NEW.company_id, '00000000-0000-0000-0000-000000000000'::UUID)) THEN
        PERFORM public.aggregate_nlp_to_company(OLD.company_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_aggregate_nlp_on_contact_change ON public.contacts;
CREATE TRIGGER tr_aggregate_nlp_on_contact_change
AFTER UPDATE OF vak_dominant, motivation_direction, working_style OR INSERT OR DELETE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.trigger_aggregate_nlp_to_company();

-- Initial aggregation
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.companies LOOP
        PERFORM public.aggregate_nlp_to_company(r.id);
    END LOOP;
END $$;
