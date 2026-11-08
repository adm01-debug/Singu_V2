CREATE OR REPLACE FUNCTION public.validar_functions_implementacao()
 RETURNS TABLE(categoria text, item text, status text, detalhes text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Teste 1: Functions de normalização
  RETURN QUERY
  SELECT 
    'Functions'::TEXT,
    'normalize_phone'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Normaliza telefones'::TEXT
  FROM pg_proc
  WHERE proname = 'normalize_phone';
  
  RETURN QUERY
  SELECT 
    'Functions'::TEXT,
    'normalize_email'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Normaliza emails'::TEXT
  FROM pg_proc
  WHERE proname = 'normalize_email';
  
  RETURN QUERY
  SELECT 
    'Functions'::TEXT,
    'is_valid_email'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Valida formato de email'::TEXT
  FROM pg_proc
  WHERE proname = 'is_valid_email';
  
  -- Teste 2: Functions de timestamp
  RETURN QUERY
  SELECT 
    'Functions'::TEXT,
    'update_updated_at'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Atualiza updated_at em UPDATEs'::TEXT
  FROM pg_proc
  WHERE proname = 'update_updated_at';
  
  RETURN QUERY
  SELECT 
    'Functions'::TEXT,
    'set_created_at'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Define created_at em INSERTs'::TEXT
  FROM pg_proc
  WHERE proname = 'set_created_at';
  
  -- Teste 3: Triggers de timestamp
  RETURN QUERY
  SELECT 
    'Triggers Timestamp'::TEXT,
    'companies'::TEXT,
    CASE WHEN COUNT(*) = 2 THEN '✓ OK' ELSE '✗ FALTA' END,
    COUNT(*)::TEXT || ' triggers'
  FROM pg_trigger
  WHERE tgrelid = 'companies'::regclass
    AND tgname LIKE 'trg_companies_%';
  
  RETURN QUERY
  SELECT 
    'Triggers Timestamp'::TEXT,
    'contacts'::TEXT,
    CASE WHEN COUNT(*) >= 2 THEN '✓ OK' ELSE '✗ FALTA' END,
    COUNT(*)::TEXT || ' triggers'
  FROM pg_trigger
  WHERE tgrelid = 'contacts'::regclass
    AND tgname LIKE 'trg_contacts_%';
  
  RETURN QUERY
  SELECT 
    'Triggers Timestamp'::TEXT,
    'interactions'::TEXT,
    CASE WHEN COUNT(*) = 2 THEN '✓ OK' ELSE '✗ FALTA' END,
    COUNT(*)::TEXT || ' triggers'
  FROM pg_trigger
  WHERE tgrelid = 'interactions'::regclass
    AND tgname LIKE 'trg_interactions_%';
  
  -- Teste 4: Triggers de normalização
  RETURN QUERY
  SELECT 
    'Triggers Normalização'::TEXT,
    'company_phones'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Normaliza telefones'::TEXT
  FROM pg_trigger
  WHERE tgrelid = 'company_phones'::regclass
    AND tgname LIKE '%normalize%';
  
  RETURN QUERY
  SELECT 
    'Triggers Normalização'::TEXT,
    'contact_phones'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Normaliza telefones'::TEXT
  FROM pg_trigger
  WHERE tgrelid = 'contact_phones'::regclass
    AND tgname LIKE '%normalize%';
  
  RETURN QUERY
  SELECT 
    'Triggers Normalização'::TEXT,
    'company_emails'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Normaliza emails'::TEXT
  FROM pg_trigger
  WHERE tgrelid = 'company_emails'::regclass
    AND tgname LIKE '%normalize%';
  
  RETURN QUERY
  SELECT 
    'Triggers Normalização'::TEXT,
    'contact_emails'::TEXT,
    CASE WHEN COUNT(*) = 1 THEN '✓ OK' ELSE '✗ FALTA' END,
    'Normaliza emails'::TEXT
  FROM pg_trigger
  WHERE tgrelid = 'contact_emails'::regclass
    AND tgname LIKE '%normalize%';
  
  -- Teste 5: Dados normalizados
  RETURN QUERY
  SELECT 
    'Dados'::TEXT,
    'Telefones normalizados'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM company_phones WHERE numero != normalize_phone(numero)) = 0
       AND (SELECT COUNT(*) FROM contact_phones WHERE numero != normalize_phone(numero)) = 0
      THEN '✓ OK'
      ELSE '⚠ NORMALIZAR'
    END,
    'Todos telefones apenas com números'::TEXT;
  
  RETURN QUERY
  SELECT 
    'Dados'::TEXT,
    'Emails normalizados'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM company_emails WHERE email != normalize_email(email)) = 0
       AND (SELECT COUNT(*) FROM contact_emails WHERE email != normalize_email(email)) = 0
      THEN '✓ OK'
      ELSE '⚠ NORMALIZAR'
    END,
    'Todos emails em lowercase'::TEXT;
    
END;
$function$
