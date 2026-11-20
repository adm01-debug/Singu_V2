
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'other' CHECK (document_type IN ('contract', 'proposal', 'nda', 'invoice', 'report', 'presentation', 'spreadsheet', 'image', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own documents" ON public.documents;
DROP POLICY IF EXISTS "Users manage own documents" ON public.documents;  -- [singu-idem]
CREATE POLICY "Users manage own documents" ON public.documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Users upload own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own docs" ON storage.objects;  -- [singu-idem]
CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users read own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users read own docs" ON storage.objects;  -- [singu-idem]
CREATE POLICY "Users read own docs" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users delete own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own docs" ON storage.objects;  -- [singu-idem]
CREATE POLICY "Users delete own docs" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);