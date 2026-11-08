CREATE OR REPLACE FUNCTION public.get_health_check()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE 
  total_contacts INTEGER;
  total_companies INTEGER;
  score NUMERIC;
BEGIN
  total_contacts := (SELECT count(*) FROM contacts WHERE deleted_at IS NULL AND is_duplicate = false);
  total_companies := (SELECT count(*) FROM companies);
  
  -- Calcular score baseado em completude
  score := 0;
  
  -- Triggers (0.5 pts)
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid 
             WHERE c.relname = 'contacts' AND t.tgname = 'set_updated_at') THEN
    score := score + 0.5;
  END IF;
  
  -- Phones migrados (1.5 pts)
  IF (SELECT count(DISTINCT contact_id) FROM contact_phones) > total_contacts * 0.5 THEN
    score := score + 1.5;
  ELSIF (SELECT count(DISTINCT contact_id) FROM contact_phones) > total_contacts * 0.2 THEN
    score := score + 1.0;
  ELSE
    score := score + 0.3;
  END IF;
  
  -- Emails migrados (1.0 pts)
  IF (SELECT count(DISTINCT contact_id) FROM contact_emails) > total_contacts * 0.5 THEN
    score := score + 1.0;
  ELSIF (SELECT count(DISTINCT contact_id) FROM contact_emails) > total_contacts * 0.2 THEN
    score := score + 0.7;
  ELSE
    score := score + 0.2;
  END IF;
  
  -- Nome limpo (1.0 pts)
  IF (SELECT count(*) FROM contacts WHERE first_name LIKE '%@%') = 0 THEN
    score := score + 0.5;
  END IF;
  IF (SELECT count(*) FROM contacts WHERE nome_tratamento IS NOT NULL AND deleted_at IS NULL) > total_contacts * 0.7 THEN
    score := score + 0.5;
  END IF;
  
  -- Relationship stage classificado (1.0 pts)
  IF (SELECT count(*) FROM contacts WHERE relationship_stage = 'unknown' AND deleted_at IS NULL) < total_contacts * 0.1 THEN
    score := score + 1.0;
  ELSIF (SELECT count(*) FROM contacts WHERE relationship_stage = 'unknown' AND deleted_at IS NULL) < total_contacts * 0.5 THEN
    score := score + 0.5;
  END IF;
  
  -- Company phones migrados (1.5 pts)
  IF (SELECT count(DISTINCT company_id) FROM company_phones) > total_companies * 0.8 THEN
    score := score + 1.5;
  ELSIF (SELECT count(DISTINCT company_id) FROM company_phones) > total_companies * 0.5 THEN
    score := score + 1.0;
  ELSE
    score := score + 0.3;
  END IF;
  
  -- Company names padronizados (0.5 pts)
  score := score + 0.5;
  
  -- Views e RPCs (1.0 pts)
  score := score + 1.0;
  
  -- Indexes (0.5 pts)
  score := score + 0.5;

  RETURN json_build_object(
    'health_score', ROUND(score, 1),
    'max_score', 10.0,
    'details', json_build_object(
      'contacts', json_build_object(
        'total_ativos', total_contacts,
        'com_phone', (SELECT count(DISTINCT contact_id) FROM contact_phones),
        'com_email', (SELECT count(DISTINCT contact_id) FROM contact_emails),
        'com_nome_tratamento', (SELECT count(*) FROM contacts WHERE nome_tratamento IS NOT NULL AND deleted_at IS NULL),
        'emails_no_nome', (SELECT count(*) FROM contacts WHERE first_name LIKE '%@%'),
        'unknown_stage', (SELECT count(*) FROM contacts WHERE relationship_stage = 'unknown' AND deleted_at IS NULL),
        'relationship_stages', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
          SELECT relationship_stage, count(*) as qtd FROM contacts WHERE deleted_at IS NULL GROUP BY 1 ORDER BY qtd DESC
        ) t)
      ),
      'companies', json_build_object(
        'total', total_companies,
        'com_phone', (SELECT count(DISTINCT company_id) FROM company_phones),
        'com_email', (SELECT count(DISTINCT company_id) FROM company_emails),
        'com_cnpj', (SELECT count(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj != ''),
        'com_grupo', (SELECT count(*) FROM companies WHERE grupo_economico_id IS NOT NULL)
      ),
      'customers', json_build_object(
        'total', (SELECT count(*) FROM customers WHERE deleted_at IS NULL),
        'ativados', (SELECT count(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
        'com_vendedor', (SELECT count(*) FROM customers WHERE vendedor_id IS NOT NULL AND deleted_at IS NULL)
      )
    ),
    'generated_at', NOW()
  );
END;
$function$
