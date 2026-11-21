CREATE OR REPLACE FUNCTION public.trg_normalizar_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  email_clean TEXT;
  local_part TEXT;
  domain_part TEXT;
  dominios_pessoais TEXT[] := ARRAY[
    'gmail.com', 'gmail.com.br',
    'hotmail.com', 'hotmail.com.br',
    'outlook.com', 'outlook.com.br',
    'yahoo.com', 'yahoo.com.br',
    'live.com', 'live.com.br',
    'msn.com', 'msn.com.br',
    'icloud.com',
    'protonmail.com', 'proton.me',
    'uol.com.br', 'bol.com.br',
    'terra.com.br', 'ig.com.br',
    'globo.com', 'globomail.com',
    'zipmail.com.br', 'oi.com.br',
    'r7.com', 'aol.com'
  ];
  patterns_nfe TEXT[] := ARRAY[
    'nfe', 'nf-e', 'nf_e', 'fiscal', 'xml', 'sped', 
    'notafiscal', 'nota_fiscal', 'nota-fiscal', 'danfe'
  ];
  patterns_financeiro TEXT[] := ARRAY[
    'financeiro', 'financ', 'contas', 'pagamento', 'cobranca', 
    'boleto', 'fatura', 'tesouraria', 'contabil', 'contabilidade'
  ];
  patterns_comercial TEXT[] := ARRAY[
    'comercial', 'vendas', 'venda', 'negocio', 'negocios',
    'atendimento', 'sac', 'ouvidoria', 'relacionamento'
  ];
  patterns_compras TEXT[] := ARRAY[
    'compras', 'compra', 'cotacao', 'cotacoes', 'suprimentos',
    'suprimento', 'almoxarifado', 'procurement', 'purchasing'
  ];
  patterns_marketing TEXT[] := ARRAY[
    'marketing', 'mkt', 'comunicacao', 'propaganda', 
    'midia', 'publicidade', 'endomarketing', 'digital'
  ];
  p TEXT;
BEGIN
  -- Se email está vazio, não faz nada
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  -- 1. LIMPAR: trim + lowercase
  email_clean := LOWER(TRIM(NEW.email));
  NEW.email := email_clean;

  -- 2. NORMALIZAR
  NEW.email_normalizado := email_clean;

  -- Se não tem @, retornar sem classificar
  IF position('@' in email_clean) = 0 THEN
    RETURN NEW;
  END IF;

  -- Separar local e domínio
  local_part := split_part(email_clean, '@', 1);
  domain_part := split_part(email_clean, '@', 2);

  -- 3. CLASSIFICAR email_type (só em INSERT ou se email mudou)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.email != NEW.email) THEN

    -- 3a. Domínio pessoal?
    IF domain_part = ANY(dominios_pessoais) THEN
      NEW.email_type := 'pessoal'::email_type;
      RETURN NEW;
    END IF;

    -- 3b. NFe?
    FOREACH p IN ARRAY patterns_nfe LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'nfe'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3c. Financeiro?
    FOREACH p IN ARRAY patterns_financeiro LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'financeiro'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3d. Compras? (ANTES de comercial, pois é mais específico)
    FOREACH p IN ARRAY patterns_compras LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'compras'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3e. Comercial?
    FOREACH p IN ARRAY patterns_comercial LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'comercial'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3f. Marketing?
    FOREACH p IN ARRAY patterns_marketing LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'marketing'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3g. Default: corporativo
    NEW.email_type := 'corporativo'::email_type;

  END IF;

  RETURN NEW;
END;
$function$
