-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260306191849
-- nome:   update_trigger_functions_phone_validation

-- ══════════════════════════════════════════════
-- contact_phones — função com validação de comprimento
-- ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trg_normalizar_telefone_contact()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  nn         TEXT;
  eh_celular BOOLEAN;
BEGIN
  -- Fonte: numero bruto tem prioridade; senão usa numero_normalizado
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

  -- ── VALIDAÇÃO DE COMPRIMENTO ──
  -- Fora do range 8–11 dígitos: marca como inválido e retorna sem normalizar
  IF length(nn) < 8 OR length(nn) > 11 THEN
    NEW.numero_normalizado := NULL;
    NEW.numero_e164        := NULL;
    NEW.phone_type         := 'invalido'::phone_type;
    NEW.is_whatsapp        := false;
    RETURN NEW;
  END IF;

  -- Número válido: popular campos
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

-- ══════════════════════════════════════════════
-- company_phones — mesma lógica
-- ══════════════════════════════════════════════
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

  -- ── VALIDAÇÃO DE COMPRIMENTO ──
  IF length(nn) < 8 OR length(nn) > 11 THEN
    NEW.numero_normalizado := NULL;
    NEW.numero_e164        := NULL;
    NEW.phone_type         := 'invalido'::phone_type;
    NEW.is_whatsapp        := false;
    RETURN NEW;
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
