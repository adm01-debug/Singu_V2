DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.sequence_enrollments'::regclass
      AND conname = 'sequence_enrollments_sequence_id_fkey'
      AND confrelid = 'public.sequences'::regclass
      AND confdeltype = 'c'
      AND convalidated
  ) THEN
    RAISE EXCEPTION 'Processador exige vínculo validado entre inscrições e sequências';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.sequence_enrollments e
    LEFT JOIN public.sequences s ON s.id = e.sequence_id
    WHERE s.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Inscrição sem sequência';
  END IF;
END $test$;
