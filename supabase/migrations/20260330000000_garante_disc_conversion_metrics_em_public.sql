-- Migration nova: garante disc_conversion_metrics em public ANTES das policies de 20260405.
-- Producao moveu esta tabela para _dormant via 20260321192912 (versao original).
-- A branch editou aquela versao, mas o preview nao re-executa versao ja aplicada,
-- entao esta versao nova (20260330) devolve/cria a tabela em public antes do DROP POLICY.

DO $$
DECLARE
  v_in_dormant BOOLEAN;
  v_in_public  BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE c.relname = 'disc_conversion_metrics' AND n.nspname = '_dormant')
    INTO v_in_dormant;
  SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE c.relname = 'disc_conversion_metrics' AND n.nspname = 'public')
    INTO v_in_public;

  IF v_in_dormant AND NOT v_in_public THEN
    ALTER TABLE _dormant.disc_conversion_metrics SET SCHEMA public;
  ELSIF NOT v_in_public THEN
    CREATE TABLE public.disc_conversion_metrics (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      disc_profile TEXT NOT NULL CHECK (disc_profile IN ('D', 'I', 'S', 'C')),
      blend_profile TEXT,
      total_contacts INTEGER NOT NULL DEFAULT 0,
      total_opportunities INTEGER NOT NULL DEFAULT 0,
      converted_count INTEGER NOT NULL DEFAULT 0,
      lost_count INTEGER NOT NULL DEFAULT 0,
      conversion_rate NUMERIC(5,2),
      average_deal_size NUMERIC,
      average_sales_cycle_days INTEGER,
      average_relationship_score NUMERIC(5,2),
      average_compatibility_score NUMERIC(5,2),
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE (user_id, disc_profile, period_start, period_end)
    );
  END IF;
END
$$;

ALTER TABLE public.disc_conversion_metrics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_disc_conversion_metrics_user ON public.disc_conversion_metrics(user_id);