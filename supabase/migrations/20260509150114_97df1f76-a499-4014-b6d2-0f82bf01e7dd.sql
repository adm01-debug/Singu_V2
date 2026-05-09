-- Ensure transcription column exists in interactions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'transcription') THEN
        ALTER TABLE public.interactions ADD COLUMN transcription TEXT;
    END IF;
END $$;

-- Ensure family_info column exists in contacts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'family_info') THEN
        ALTER TABLE public.contacts ADD COLUMN family_info TEXT;
    END IF;
END $$;

-- Ensure hobbies column exists in contacts as an array
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'hobbies') THEN
        ALTER TABLE public.contacts ADD COLUMN hobbies TEXT[];
    END IF;
END $$;

-- Ensure interests column exists in contacts as an array
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'interests') THEN
        ALTER TABLE public.contacts ADD COLUMN interests TEXT[];
    END IF;
END $$;

-- Re-enable RLS and ensure policies are solid
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- If policies don't exist, they should be created (usually they already exist but let's be safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interactions' AND policyname = 'Users can access their own interactions') THEN
        CREATE POLICY "Users can access their own interactions" ON public.interactions FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Users can access their own contacts') THEN
        CREATE POLICY "Users can access their own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
