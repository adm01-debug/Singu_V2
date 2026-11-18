-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417103206
-- nome:   singu_fix_14_sync_company_address_to_city_state

-- ============================================================================
-- FIX #14 — Sync company_addresses → companies.city/state/address
-- Quando address 1:N é criado/atualizado, propaga primary para colunas inline SINGU
-- Além disso, backfill retroativo das 46.839 companies que têm address geolocalizado
-- ============================================================================

-- Trigger em company_addresses: ao inserir/atualizar primary, atualiza companies
CREATE OR REPLACE FUNCTION public.singu_sync_company_address()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_cidade text; v_estado text; v_cep text;
  v_logradouro text; v_numero text; v_bairro text;
  v_address_full text;
BEGIN
  v_company_id := COALESCE(NEW.company_id, OLD.company_id);

  -- Pegar address primário (qualquer tipo)
  SELECT cidade, estado, cep, logradouro, numero, bairro
  INTO v_cidade, v_estado, v_cep, v_logradouro, v_numero, v_bairro
  FROM public.company_addresses
  WHERE company_id = v_company_id
  ORDER BY is_primary DESC NULLS LAST, created_at DESC
  LIMIT 1;

  -- Compor address string curta no formato SINGU
  v_address_full := NULLIF(trim(
    COALESCE(v_logradouro,'') || 
    CASE WHEN v_numero IS NOT NULL THEN ', ' || v_numero ELSE '' END ||
    CASE WHEN v_bairro IS NOT NULL THEN ' - ' || v_bairro ELSE '' END
  ), '');

  UPDATE public.companies 
  SET 
    city = v_cidade,
    state = v_estado,
    address = v_address_full
  WHERE id = v_company_id
    AND (
      COALESCE(city,'') IS DISTINCT FROM COALESCE(v_cidade,'')
      OR COALESCE(state,'') IS DISTINCT FROM COALESCE(v_estado,'')
      OR COALESCE(address,'') IS DISTINCT FROM COALESCE(v_address_full,'')
    );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.singu_sync_company_address() IS 'SINGU: sincroniza company_addresses → companies.city/state/address (primary address).';

DROP TRIGGER IF EXISTS trg_singu_sync_company_address ON public.company_addresses;
CREATE TRIGGER trg_singu_sync_company_address
AFTER INSERT OR UPDATE OR DELETE ON public.company_addresses
FOR EACH ROW
EXECUTE FUNCTION public.singu_sync_company_address();

-- Reverse: SINGU insere companies.city/state inline → criar company_address se não existir
CREATE OR REPLACE FUNCTION public.singu_reverse_sync_company_address()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Se SINGU forneceu city/state inline e empresa não tem endereço, criar
  IF (NEW.city IS NOT NULL OR NEW.state IS NOT NULL) 
     AND NOT EXISTS (SELECT 1 FROM public.company_addresses WHERE company_id = NEW.id) THEN
    INSERT INTO public.company_addresses (company_id, cidade, estado, is_primary, origem, tipo)
    VALUES (NEW.id, NEW.city, NEW.state, true, 'SINGU', 'comercial')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_reverse_sync_company_address() IS 'SINGU: quando SINGU insere companies.city/state inline e não existe em company_addresses, cria registro.';

DROP TRIGGER IF EXISTS trg_singu_reverse_sync_company_address ON public.companies;
CREATE TRIGGER trg_singu_reverse_sync_company_address
AFTER INSERT OR UPDATE OF city, state
ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.singu_reverse_sync_company_address();
