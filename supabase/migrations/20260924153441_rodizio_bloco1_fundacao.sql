-- Rodízio de Carteira — Bloco 1: Fundação
-- Não roda nada automaticamente (kill switch RODIZIO_CLOSER_ATIVO/RODIZIO_SDR_ATIVO=false).
-- Não toca em nenhum customers.vendedor_id existente.

DO $migration$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS participa_rodizio_closer boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS participa_rodizio_sdr boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS ordem_rodizio integer,
      ADD COLUMN IF NOT EXISTS capacidade_max integer,
      ADD COLUMN IF NOT EXISTS afastado_ate date;

    UPDATE public.users SET participa_rodizio_closer = true, ordem_rodizio = v.ordem
    FROM (VALUES (11,1),(12,2),(13,3),(14,4),(15,5),(17,6)) AS v(id, ordem)
    WHERE public.users.id = v.id;
  END IF;

  IF to_regclass('public.customers') IS NOT NULL
    AND to_regclass('public.companies') IS NOT NULL
    AND to_regclass('public.users') IS NOT NULL
  THEN
    CREATE TABLE IF NOT EXISTS public.customer_purchases (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id uuid NOT NULL REFERENCES public.customers(id),
      company_id uuid NOT NULL REFERENCES public.companies(id),
      origem text NOT NULL CHECK (origem IN ('ERP','MANUAL')),
      origem_pedido_id text NOT NULL,
      data_pedido date NOT NULL,
      valor numeric(14,2),
      vendedor_id integer REFERENCES public.users(id),
      vendedor_credito_id integer REFERENCES public.users(id),
      sdr_credito_id integer REFERENCES public.users(id),
      raw jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (origem, origem_pedido_id)
    );
    CREATE INDEX IF NOT EXISTS idx_customer_purchases_customer_data
      ON public.customer_purchases (customer_id, data_pedido DESC);
    ALTER TABLE public.customer_purchases ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.customers') IS NOT NULL
    AND to_regclass('public.users') IS NOT NULL
  THEN
    CREATE TABLE IF NOT EXISTS public.customer_rotation_state (
      customer_id uuid PRIMARY KEY REFERENCES public.customers(id),
      segmento text NOT NULL DEFAULT 'NAO_ATIVADO'
        CHECK (segmento IN ('ATIVO','INATIVO','NAO_ATIVADO','BLOQUEADO','POOL_FRIO','FORA_RODIZIO')),
      ciclo_closer integer NOT NULL DEFAULT 1,
      closers_visitados integer[] NOT NULL DEFAULT '{}',
      ciclo_sdr integer NOT NULL DEFAULT 1,
      sdrs_visitados integer[] NOT NULL DEFAULT '{}',
      proxima_rotacao_closer date,
      proxima_rotacao_sdr date,
      bloqueado_ate date,
      bloqueio_motivo text,
      bloqueado_por_id integer REFERENCES public.users(id),
      bloqueio_aprovado_por_id integer REFERENCES public.users(id),
      sla_contato_vencido boolean NOT NULL DEFAULT false,
      pool_frio boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_rotation_state_segmento_closer
      ON public.customer_rotation_state (segmento, proxima_rotacao_closer);
    CREATE INDEX IF NOT EXISTS idx_rotation_state_segmento_sdr
      ON public.customer_rotation_state (segmento, proxima_rotacao_sdr);
    ALTER TABLE public.customer_rotation_state ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    CREATE TABLE IF NOT EXISTS public.rodizio_execucoes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tipo text NOT NULL CHECK (tipo IN ('CLOSER','SDR','SEGMENTAR','DISTRIBUICAO_INICIAL')),
      modo text NOT NULL CHECK (modo IN ('DRY_RUN','REAL','ROLLBACK')),
      iniciado_em timestamptz NOT NULL DEFAULT now(),
      finalizado_em timestamptz,
      parametros jsonb,
      total_elegiveis integer,
      total_rotacionados integer,
      distribuicao jsonb,
      erros jsonb,
      executado_por_id integer REFERENCES public.users(id),
      revertida_por_execucao_id uuid REFERENCES public.rodizio_execucoes(id)
    );
    ALTER TABLE public.rodizio_execucoes ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.customers') IS NOT NULL
    AND to_regclass('public.users') IS NOT NULL
    AND to_regclass('public.rodizio_execucoes') IS NOT NULL
  THEN
    CREATE TABLE IF NOT EXISTS public.rodizio_distribuicao_staging (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      onda integer NOT NULL,
      customer_id uuid NOT NULL REFERENCES public.customers(id),
      closer_destino_id integer REFERENCES public.users(id),
      sdr_destino_id integer REFERENCES public.users(id),
      origem text NOT NULL CHECK (origem IN ('MANUAL','SUGESTAO_MOTOR','IMPORT_CSV')),
      status text NOT NULL DEFAULT 'RASCUNHO'
        CHECK (status IN ('RASCUNHO','APROVADO','APLICADO','REJEITADO')),
      criado_por_id integer REFERENCES public.users(id),
      aprovado_por_id integer REFERENCES public.users(id),
      aplicado_em timestamptz,
      execucao_id uuid REFERENCES public.rodizio_execucoes(id),
      observacoes text,
      UNIQUE (onda, customer_id)
    );
    ALTER TABLE public.rodizio_distribuicao_staging ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.customer_ownership_history') IS NOT NULL THEN
    ALTER TABLE public.customer_ownership_history
      ADD COLUMN IF NOT EXISTS ciclo integer,
      ADD COLUMN IF NOT EXISTS posicao_no_ciclo integer;
    IF to_regclass('public.rodizio_execucoes') IS NOT NULL THEN
      ALTER TABLE public.customer_ownership_history
        ADD COLUMN IF NOT EXISTS execucao_id uuid REFERENCES public.rodizio_execucoes(id);
    END IF;
  END IF;

  IF to_regclass('public.customer_sdr_history') IS NOT NULL THEN
    ALTER TABLE public.customer_sdr_history
      ADD COLUMN IF NOT EXISTS ciclo integer,
      ADD COLUMN IF NOT EXISTS posicao_no_ciclo integer;
    IF to_regclass('public.rodizio_execucoes') IS NOT NULL THEN
      ALTER TABLE public.customer_sdr_history
        ADD COLUMN IF NOT EXISTS execucao_id uuid REFERENCES public.rodizio_execucoes(id);
    END IF;
  END IF;

  IF to_regclass('public.config_regras_negocio') IS NOT NULL THEN
    INSERT INTO public.config_regras_negocio (chave, valor, descricao) VALUES
      ('RODIZIO_CLOSER_ATIVO', 'false', 'Kill switch: liga rotação automática de closer'),
      ('RODIZIO_SDR_ATIVO', 'false', 'Kill switch: liga rotação automática de SDR'),
      ('RODIZIO_DIAS_PROTECAO_POS_PEDIDO', '180', 'Cliente ATIVO por N dias após pedido'),
      ('RODIZIO_DIAS_CICLO_CLOSER', '180', 'Posse sem pedido → roda closer'),
      ('RODIZIO_DIAS_CICLO_SDR', '180', 'Posse sem qualificação → roda SDR'),
      ('RODIZIO_CREDITO_ANTERIOR_DIAS', '30', 'Janela de crédito ao closer anterior após rotação'),
      ('RODIZIO_MAX_POR_CLOSER_POR_ONDA', '250', 'Teto de clientes por closer por onda'),
      ('RODIZIO_MAX_POR_SDR_POR_ONDA', '250', 'Teto de clientes por SDR por onda'),
      ('RODIZIO_SLA_PRIMEIRO_CONTATO_DIAS', '7', 'SLA de primeiro contato após rotação'),
      ('RODIZIO_MAX_BLOQUEIOS_MES', '10', 'Bloqueios automáticos por closer por mês (D10, provisório)'),
      ('RODIZIO_BLOQUEIO_MAX_DIAS', '60', 'Duração máxima de um bloqueio manual'),
      ('RODIZIO_CICLOS_ATE_POOL_FRIO', '2', 'Ciclos completos do anel sem pedido até pool frio')
    ON CONFLICT (chave) DO NOTHING;
  END IF;
END;
$migration$;
