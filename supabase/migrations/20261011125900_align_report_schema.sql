-- Completar no schema limpo as colunas de relatórios já existentes no canônico.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS valor numeric;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS data_interacao timestamptz;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS channel text;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS data_followup timestamptz;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS requer_followup boolean;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS followup_concluido boolean;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
      AND table_name = 'deals' AND column_name = 'value') THEN
    EXECUTE 'UPDATE public.deals SET valor = value WHERE valor IS NULL';
  END IF;
END $$;
UPDATE public.interactions SET data_interacao = created_at WHERE data_interacao IS NULL;
ALTER TABLE public.interactions ALTER COLUMN data_interacao SET DEFAULT now();

-- DOWN MIGRATION (Rollback sem descarte de dados)
-- SELECT 'Colunas aditivas mantidas: também existiam antes do UP no canônico';
-- As funções consumidoras são revertidas pelo DOWN de 20261011130000.
-- Não remover colunas no canônico nem apagar valores históricos recuperados.
