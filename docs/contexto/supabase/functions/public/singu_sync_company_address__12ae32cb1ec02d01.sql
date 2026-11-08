CREATE OR REPLACE FUNCTION public.singu_sync_company_address()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
