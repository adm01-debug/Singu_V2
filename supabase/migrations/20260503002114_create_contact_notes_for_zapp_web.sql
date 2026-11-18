-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260503002114
-- nome:   create_contact_notes_for_zapp_web

-- =====================================================
-- contact_notes: Notas rápidas de contato para ZAPP WEB
-- Usado pelo useContactQuickNote.ts via contactsDB bridge
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  note_type text DEFAULT 'quick',
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id ON public.contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON public.contact_notes(created_at DESC);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION fn_update_contact_notes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contact_notes_updated_at ON public.contact_notes;
CREATE TRIGGER trg_contact_notes_updated_at
  BEFORE UPDATE ON public.contact_notes
  FOR EACH ROW EXECUTE FUNCTION fn_update_contact_notes_updated_at();

-- RLS
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes" ON public.contact_notes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own notes" ON public.contact_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notes" ON public.contact_notes
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own notes" ON public.contact_notes
  FOR DELETE USING (true);

-- Comentário
COMMENT ON TABLE public.contact_notes IS 'ZAPP WEB: Notas rápidas de contato. Criadas pelo painel Contact 360° durante atendimento. FK contacts(id).';
