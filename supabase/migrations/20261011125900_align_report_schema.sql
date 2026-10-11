-- Completar no schema limpo as colunas de relatórios já existentes no canônico.
DO $$
DECLARE
  field record;
BEGIN
  FOR field IN SELECT * FROM (VALUES
    ('companies', 'deleted_at', 'timestamptz'),
    ('contacts', 'deleted_at', 'timestamptz'),
    ('deals', 'closed_at', 'timestamptz'),
    ('interactions', 'channel', 'text'),
    ('interactions', 'data_followup', 'timestamptz'),
    ('interactions', 'requer_followup', 'boolean'),
    ('interactions', 'followup_concluido', 'boolean')
  ) AS fields(table_name, column_name, column_type) LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public'
        AND c.table_name=field.table_name AND c.column_name=field.column_name) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s', field.table_name, field.column_name, field.column_type);
    END IF;
  END LOOP;
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
