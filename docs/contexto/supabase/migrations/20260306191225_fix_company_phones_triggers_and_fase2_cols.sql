-- 1. Remover trigger fantasma que destrói o numero bruto
DROP TRIGGER IF EXISTS trg_company_phones_normalize ON company_phones;

-- 2. Adicionar colunas FASE 2 (mesmas do contact_phones)
ALTER TABLE company_phones
  ADD COLUMN IF NOT EXISTS fonte          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contexto       VARCHAR(200),
  ADD COLUMN IF NOT EXISTS confiabilidade SMALLINT;

-- 3. Recriar função do trigger principal para ler de `numero` (bruto) 
--    e popular numero_normalizado + numero_e164, SEM sobrescrever numero
CREATE OR REPLACE FUNCTION trg_normalizar_telefone()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  nn         TEXT;
  eh_celular BOOLEAN;
BEGIN
  -- Prioridade: numero bruto → senão numero_normalizado
  IF NEW.numero IS NOT NULL AND NEW.numero <> '' THEN
    nn := regexp_replace(NEW.numero, '[^0-9]', '', 'g');
  ELSE
    nn := regexp_replace(COALESCE(NEW.numero_normalizado, ''), '[^0-9]', '', 'g');
  END IF;

  IF nn = '' THEN RETURN NEW; END IF;

  -- Remover DDI 55 duplicado (ex: 5511999… → 11999…)
  IF length(nn) >= 12 AND left(nn, 2) = '55' THEN
    nn := substring(nn FROM 3);
  END IF;

  -- Popular normalizado e e164 SEM tocar no numero bruto
  NEW.numero_normalizado := nn;
  NEW.numero_e164        := '+55' || nn;

  -- Classificar tipo e whatsapp
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
