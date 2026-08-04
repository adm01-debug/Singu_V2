-- Check if version column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'contacts'
        AND column_name = 'version'
    ) THEN
        ALTER TABLE public.contacts ADD COLUMN version BIGINT DEFAULT 1;
    END IF;
END $$;

-- Update existing rows to have a version if they don't
UPDATE public.contacts SET version = 1 WHERE version IS NULL;

-- Create or update trigger to increment version on update
CREATE OR REPLACE FUNCTION increment_contact_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_increment_contact_version ON public.contacts;
CREATE TRIGGER tr_increment_contact_version
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION increment_contact_version();