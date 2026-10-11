-- Completar no schema limpo as colunas de relatórios já existentes no canônico.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS channel text;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS data_followup timestamptz;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS requer_followup boolean;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS followup_concluido boolean;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
      AND table_name = 'deals' AND column_name = 'valor') THEN
    ALTER TABLE public.deals ADD COLUMN valor numeric;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
        AND table_name = 'deals' AND column_name = 'value') THEN
      ALTER TABLE public.deals ALTER COLUMN valor TYPE numeric USING value;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
      AND table_name = 'interactions' AND column_name = 'data_interacao') THEN
    ALTER TABLE public.interactions ADD COLUMN data_interacao timestamptz;
    ALTER TABLE public.interactions ALTER COLUMN data_interacao TYPE timestamptz USING created_at;
    ALTER TABLE public.interactions ALTER COLUMN data_interacao SET DEFAULT now();
  END IF;
END $$;

-- DOWN MIGRATION (Rollback sem descarte de dados)
-- SELECT 'Colunas aditivas mantidas: também existiam antes do UP no canônico';
-- As funções consumidoras são revertidas pelo DOWN de 20261011130000.
-- Não remover colunas no canônico nem apagar valores históricos recuperados.
