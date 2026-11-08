-- ══════════════════════════════════════════════
-- Regras de validação de comprimento:
-- Mínimo: 8 dígitos (número sem DDD — ex: 4002-8922 = serviço)
-- Máximo: 11 dígitos após remover DDI (DDD 2 + número 9 = 11)
-- Fora desse range: salva bruto, deixa normalizado/e164 NULL, phone_type = 'invalido'
-- ══════════════════════════════════════════════

-- Garantir que 'invalido' existe no ENUM phone_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'phone_type' AND e.enumlabel = 'invalido'
  ) THEN
    ALTER TYPE phone_type ADD VALUE 'invalido';
  END IF;
END$$;
