CREATE OR REPLACE FUNCTION public.get_data_quality_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_emp int;
  v_total_con int;
  v_cnpj int;
  v_email int;
  v_fone int;
  v_end int;
  v_uf int;
  v_con_email int;
  v_con_fone int;
  v_con_cargo int;
  v_geral int;
  result jsonb;
BEGIN
  SELECT COUNT(*) INTO v_total_emp FROM companies WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_total_con FROM contacts WHERE deleted_at IS NULL;

  SELECT COUNT(*) INTO v_cnpj FROM companies
   WHERE deleted_at IS NULL AND cnpj IS NOT NULL AND cnpj <> '';

  SELECT COUNT(DISTINCT e.company_id) INTO v_email
    FROM company_emails e JOIN companies c ON c.id = e.company_id
   WHERE c.deleted_at IS NULL AND e.email IS NOT NULL AND e.email <> '';

  SELECT COUNT(DISTINCT p.company_id) INTO v_fone
    FROM company_phones p JOIN companies c ON c.id = p.company_id
   WHERE c.deleted_at IS NULL AND p.numero IS NOT NULL AND p.numero <> '';

  SELECT COUNT(DISTINCT a.company_id) INTO v_end
    FROM company_addresses a JOIN companies c ON c.id = a.company_id
   WHERE c.deleted_at IS NULL AND a.logradouro IS NOT NULL AND a.logradouro <> '';

  SELECT COUNT(DISTINCT a.company_id) INTO v_uf
    FROM company_addresses a JOIN companies c ON c.id = a.company_id
   WHERE c.deleted_at IS NULL AND a.estado IS NOT NULL AND a.estado <> '';

  SELECT COUNT(*) INTO v_con_email FROM contacts
   WHERE deleted_at IS NULL AND email IS NOT NULL AND email <> '';
  SELECT COUNT(*) INTO v_con_fone FROM contacts
   WHERE deleted_at IS NULL AND phone IS NOT NULL AND phone <> '';
  SELECT COUNT(*) INTO v_con_cargo FROM contacts
   WHERE deleted_at IS NULL AND cargo IS NOT NULL AND cargo <> '';

  SELECT COUNT(*) INTO v_geral FROM companies
   WHERE deleted_at IS NULL AND cnpj IS NOT NULL
     AND EXISTS (SELECT 1 FROM company_emails e WHERE e.company_id = companies.id AND e.email <> '')
     AND EXISTS (SELECT 1 FROM company_phones p WHERE p.company_id = companies.id AND p.numero <> '');

  result := jsonb_build_object(
    'timestamp', now(),
    'empresas', jsonb_build_object(
      'total', v_total_emp,
      'com_cnpj', v_cnpj,
      'com_email', v_email,
      'com_telefone', v_fone,
      'com_endereco', v_end,
      'com_uf', v_uf,
      'score_completude', ROUND((v_cnpj + v_email + v_fone + v_end)::numeric
        / NULLIF(v_total_emp * 4, 0) * 100, 2)
    ),
    'contatos', jsonb_build_object(
      'total', v_total_con,
      'com_email', v_con_email,
      'com_telefone', v_con_fone,
      'com_cargo', v_con_cargo,
      'score_completude', ROUND((v_con_email + v_con_fone + v_con_cargo)::numeric
        / NULLIF(v_total_con * 3, 0) * 100, 2)
    ),
    'score_geral', ROUND(
      v_geral::numeric / NULLIF(v_total_emp, 0) * 50
      + (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL AND email IS NOT NULL
           AND phone IS NOT NULL)::numeric / NULLIF(v_total_con, 0) * 50
    , 2)
  );

  RETURN result;
END;
$function$
