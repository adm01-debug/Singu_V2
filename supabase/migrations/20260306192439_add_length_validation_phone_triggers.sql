-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260306192439
-- nome:   add_length_validation_phone_triggers

-- ══════════════════════════════════════════════
-- ITEM 1 — Validação de comprimento nos triggers
-- Rejeita: < 8 dígitos (sem DDD) ou > 13 dígitos (inválido)
-- Aceita: 8 (0800), 10 (fixo), 11 (celular), 12-13 (raros válidos)
-- ══════════════════════════════════════════════

-- contact_phones
CREATE OR REPLACE FUNCTION trg_normalizar_telefone_contact()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  nn         TEXT;
  eh_celular BOOLEAN;
BEGIN
  IF NEW.numero IS NOT NULL AND NEW.numero <> '' THEN
    nn := regexp_replace(NEW.numero, '[^0-9]', '', 'g');
  ELSE
    nn := regexp_replace(COALESCE(NEW.numero_normalizado, ''), '[^0-9]', '', 'g');
  END IF;

  IF nn = '' THEN RETURN NEW; END IF;

  -- Remover DDI 55 duplicado
  IF length(nn) >= 12 AND left(nn, 2) = '55' THEN
    nn := substring(nn FROM 3);
  END IF;

  -- Validação de comprimento
  IF length(nn) < 8 OR length(nn) > 13 THEN
    RAISE EXCEPTION 'Número de telefone inválido: "%" — deve ter entre 8 e 13 dígitos (recebido: % dígitos)',
      COALESCE(NEW.numero, NEW.numero_normalizado), length(nn);
  END IF;

  NEW.numero_normalizado := nn;
  NEW.numero_e164        := '+55' || nn;

  eh_celular := (length(nn) = 11 AND substring(nn FROM 3 FOR 1) = '9');

  IF TG_OP = 'INSERT' OR
     (TG_OP = 'UPDATE' AND OLD.numero IS DISTINCT FROM NEW.numero)
  THEN
    IF eh_celular THEN
      NEW.phone_type  := 'celular_corporativo'::phone_type;
      NEW.is_whatsapp := true;
    ELSE
      NEW.phone_type  := 'fixo_comercial'::phone_type;
      NEW.is_whatsapp := COALESCE(NEW.is_whatsapp, false);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- company_phones (mesma lógica)
CREATE OR REPLACE FUNCTION trg_normalizar_telefone()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  nn         TEXT;
  eh_celular BOOLEAN;
BEGIN
  IF NEW.numero IS NOT NULL AND NEW.numero <> '' THEN
    nn := regexp_replace(NEW.numero, '[^0-9]', '', 'g');
  ELSE
    nn := regexp_replace(COALESCE(NEW.numero_normalizado, ''), '[^0-9]', '', 'g');
  END IF;

  IF nn = '' THEN RETURN NEW; END IF;

  IF length(nn) >= 12 AND left(nn, 2) = '55' THEN
    nn := substring(nn FROM 3);
  END IF;

  IF length(nn) < 8 OR length(nn) > 13 THEN
    RAISE EXCEPTION 'Número de telefone inválido: "%" — deve ter entre 8 e 13 dígitos (recebido: % dígitos)',
      COALESCE(NEW.numero, NEW.numero_normalizado), length(nn);
  END IF;

  NEW.numero_normalizado := nn;
  NEW.numero_e164        := '+55' || nn;

  eh_celular := (length(nn) = 11 AND substring(nn FROM 3 FOR 1) = '9');

  IF TG_OP = 'INSERT' OR
     (TG_OP = 'UPDATE' AND OLD.numero IS DISTINCT FROM NEW.numero)
  THEN
    IF eh_celular THEN
      NEW.phone_type  := 'celular_corporativo'::phone_type;
      NEW.is_whatsapp := true;
    ELSE
      NEW.phone_type  := 'fixo_comercial'::phone_type;
      NEW.is_whatsapp := COALESCE(NEW.is_whatsapp, false);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
