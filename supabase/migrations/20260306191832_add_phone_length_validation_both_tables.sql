-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260306191832
-- nome:   add_phone_length_validation_both_tables

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
