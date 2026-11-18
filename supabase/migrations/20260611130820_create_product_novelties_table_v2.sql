-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260611130820
-- nome:   create_product_novelties_table_v2

-- ═══════════════════════════════════════════════════════════════════════════
-- MELHORIA 1: Criar tabela product_novelties + índices + triggers + RLS
-- Recria fn_sync_novelty_to_product inline para garantir compatibilidade
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger de atualização de timestamp
CREATE OR REPLACE FUNCTION public.fn_set_novelty_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Trigger de sincronização novelty → products.is_new
CREATE OR REPLACE FUNCTION public.fn_sync_novelty_to_product()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            UPDATE products SET is_new = FALSE WHERE id = NEW.product_id;
        END IF;
        IF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
            UPDATE products SET is_new = TRUE WHERE id = NEW.product_id;
        END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN
        UPDATE products SET is_new = FALSE WHERE id = OLD.product_id;
    END IF;
    IF TG_OP = 'INSERT' THEN
        UPDATE products SET is_new = TRUE WHERE id = NEW.product_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar tabela
CREATE TABLE IF NOT EXISTS public.product_novelties (
    id                    uuid          NOT NULL DEFAULT gen_random_uuid(),
    product_id            uuid          NOT NULL,
    supplier_id           uuid          NULL,
    supplier_code         varchar(100)  NULL,
    supplier_product_code varchar(100)  NULL,
    source                text          NOT NULL DEFAULT 'manual',
    detected_at           timestamptz   NOT NULL DEFAULT now(),
    expires_at            timestamptz   NULL,
    is_active             boolean       NOT NULL DEFAULT true,
    is_highlighted        boolean       NOT NULL DEFAULT false,
    notes                 text          NULL,
    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT product_novelties_pkey           PRIMARY KEY (id),
    CONSTRAINT product_novelties_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT product_novelties_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL,
    CONSTRAINT product_novelties_product_id_unique UNIQUE (product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pn_is_active     ON public.product_novelties (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pn_expires_at    ON public.product_novelties (expires_at);
CREATE INDEX IF NOT EXISTS idx_pn_supplier_code ON public.product_novelties (supplier_code) WHERE supplier_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pn_detected_at   ON public.product_novelties (detected_at DESC);

-- Triggers
CREATE TRIGGER trg_novelty_updated_at
    BEFORE UPDATE ON public.product_novelties
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_novelty_updated_at();

CREATE TRIGGER trg_sync_novelty_to_product
    AFTER INSERT OR UPDATE OR DELETE ON public.product_novelties
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_novelty_to_product();

-- RLS
ALTER TABLE public.product_novelties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_novelties"    ON public.product_novelties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_all_novelties"  ON public.product_novelties FOR ALL    TO service_role       USING (true) WITH CHECK (true);

GRANT SELECT ON public.product_novelties TO anon, authenticated;
GRANT ALL    ON public.product_novelties TO service_role;

COMMENT ON TABLE public.product_novelties IS 
'Ciclo de vida do selo NOVO. Pipeline popula via fn_populate_novelties_from_supplier. Trigger sincroniza products.is_new automaticamente.';
