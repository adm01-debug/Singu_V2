-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260306190956
-- nome:   add_numero_raw_contact_phones

-- Restaurar coluna numero (valor bruto capturado) em contact_phones
ALTER TABLE contact_phones
  ADD COLUMN IF NOT EXISTS numero VARCHAR(50);

-- Fazer retroativamente: popular numero com o valor já normalizado
-- (para registros existentes não temos o bruto, então usamos o normalizado como proxy)
UPDATE contact_phones
SET numero = numero_normalizado
WHERE numero IS NULL AND numero_normalizado IS NOT NULL;

-- Ajustar o trigger para aceitar entrada tanto via numero quanto via numero_normalizado
-- (se vier numero bruto, normaliza; se vier numero_normalizado direto, usa ele)
CREATE OR REPLACE FUNCTION trg_normalizar_telefone_contact()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  nn         TEXT;
  eh_celular BOOLEAN;
BEGIN
  -- Prioridade: se vier numero bruto, usa ele como fonte; senão usa numero_normalizado
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

  NEW.numero_normalizado := nn;
  NEW.numero_e164        := '+55' || nn;

  -- celular = 11 dígitos com 3º dígito = '9'
  eh_celular := (length(nn) = 11 AND substring(nn FROM 3 FOR 1) = '9');

  IF TG_OP = 'INSERT' OR
     (TG_OP = 'UPDATE' AND OLD.numero_normalizado IS DISTINCT FROM NEW.numero_normalizado)
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
