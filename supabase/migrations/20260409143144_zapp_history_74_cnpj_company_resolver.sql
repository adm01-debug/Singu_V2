-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409143144
-- nome:   zapp_history_74_cnpj_company_resolver

-- Quando NLP detecta CNPJ, tenta achar a empresa no SINGU e linkar ao contato
CREATE OR REPLACE FUNCTION zapp_history.resolve_company_from_cnpj()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
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
$fn$;

DROP TRIGGER IF EXISTS trg_resolve_company_cnpj ON zapp_history.messages;
CREATE TRIGGER trg_resolve_company_cnpj
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.resolve_company_from_cnpj();
