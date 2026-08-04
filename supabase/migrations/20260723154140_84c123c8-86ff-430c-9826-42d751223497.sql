
-- Enable RLS on existing partitions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    JOIN pg_namespace np ON np.oid = p.relnamespace
    WHERE np.nspname='public' AND p.relname='ai_gateway_metrics'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- Update ensure function to enable RLS on newly created partitions
CREATE OR REPLACE FUNCTION public.ensure_ai_gateway_metrics_partition(target_month date DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m_start date;
  m_end   date;
  part_name text;
BEGIN
  m_start := date_trunc('month', COALESCE(target_month, (now() + interval '1 month')::date))::date;
  m_end   := (m_start + interval '1 month')::date;
  part_name := format('ai_gateway_metrics_%s', to_char(m_start, 'YYYY_MM'));

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname=part_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.ai_gateway_metrics FOR VALUES FROM (%L) TO (%L)',
      part_name, m_start, m_end
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
  END IF;

  RETURN part_name;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_ai_gateway_metrics_partition(date) FROM PUBLIC, anon, authenticated;
