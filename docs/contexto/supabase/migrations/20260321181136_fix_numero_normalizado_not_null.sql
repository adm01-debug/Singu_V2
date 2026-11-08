-- ============================================================
-- FALHA #1: Fechar furo na UNIQUE — NOT NULL em numero_normalizado
-- ============================================================
ALTER TABLE public.company_phones
  ALTER COLUMN numero_normalizado SET NOT NULL;

ALTER TABLE public.contact_phones
  ALTER COLUMN numero_normalizado SET NOT NULL;
