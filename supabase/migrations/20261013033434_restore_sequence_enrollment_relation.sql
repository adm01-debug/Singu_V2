DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.sequence_enrollments'::regclass
      AND conname = 'sequence_enrollments_sequence_id_fkey'
  ) THEN
    ALTER TABLE public.sequence_enrollments
      ADD CONSTRAINT sequence_enrollments_sequence_id_fkey
      FOREIGN KEY (sequence_id) REFERENCES public.sequences(id)
      ON DELETE CASCADE NOT VALID;
  END IF;
END $migration$;

ALTER TABLE public.sequence_enrollments
  VALIDATE CONSTRAINT sequence_enrollments_sequence_id_fkey;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.sequence_enrollments'::regclass
      AND conname = 'sequence_enrollments_sequence_id_fkey'
      AND confrelid = 'public.sequences'::regclass
      AND confdeltype = 'c'
      AND convalidated
  ) THEN
    RAISE EXCEPTION 'Vínculo entre inscrições e sequências inválido';
  END IF;
END $migration$;

NOTIFY pgrst, 'reload schema';

-- Rollback: somente se esta migration criou a constraint, com o processador suspenso.
-- ALTER TABLE public.sequence_enrollments DROP CONSTRAINT sequence_enrollments_sequence_id_fkey;
-- NOTIFY pgrst, 'reload schema';
