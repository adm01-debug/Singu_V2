CREATE OR REPLACE FUNCTION zapp_history.resolve_company_from_cnpj()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_cnpj_raw TEXT;
  v_cnpj_clean TEXT;
  v_company_id UUID;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.nlp_structured_order IS NULL THEN
    RETURN NEW;
  END IF;

  v_cnpj_raw := NEW.nlp_structured_order->>'cnpj';
  IF v_cnpj_raw IS NULL THEN RETURN NEW; END IF;

  v_cnpj_clean := regexp_replace(v_cnpj_raw, '\D', '', 'g');
  IF length(v_cnpj_clean) <> 14 THEN RETURN NEW; END IF;

  -- Tenta achar empresa no SINGU pelo CNPJ
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE regexp_replace(COALESCE(cnpj, ''), '\D', '', 'g') = v_cnpj_clean
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    -- Linka empresa à mensagem
    UPDATE zapp_history.messages
    SET company_id = v_company_id
    WHERE id = NEW.id;

    -- Linka empresa ao contato (se ainda não tiver)
    UPDATE public.contacts
    SET company_id = v_company_id, updated_at = NOW()
    WHERE id = NEW.contact_id AND company_id IS NULL;

    -- Linka à conversa
    UPDATE zapp_history.conversations
    SET company_id = v_company_id
    WHERE id = NEW.conversation_id AND company_id IS NULL;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$
