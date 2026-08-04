-- Remove política pública e força acesso via Edge Function que valida token
DROP POLICY IF EXISTS "Public can view by token" ON public.document_signatures;