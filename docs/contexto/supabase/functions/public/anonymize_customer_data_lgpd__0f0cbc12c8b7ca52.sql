CREATE OR REPLACE FUNCTION public.anonymize_customer_data_lgpd(p_company_id uuid, p_reason text DEFAULT 'customer_request'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_name text;
  v_contacts_count int;
  v_interactions_count int;
BEGIN
  SELECT COALESCE(nome_fantasia, nome_crm, razao_social) INTO v_company_name FROM companies WHERE id = p_company_id;
  
  IF v_company_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Company not found');
  END IF;
  
  UPDATE companies SET
    nome_fantasia = 'ANONIMIZADO_' || LEFT(id::text, 8),
    nome_crm = 'ANONIMIZADO_' || LEFT(id::text, 8),
    razao_social = 'DADOS REMOVIDOS POR LGPD',
    cnpj = NULL,
    email = NULL,
    phone = NULL,
    observacoes = 'Dados anonimizados em ' || NOW()::text || ' - Motivo: ' || p_reason,
    status = 'inativo'
  WHERE id = p_company_id;
  
  UPDATE contacts SET
    name = 'ANONIMIZADO',
    email = NULL,
    phone = NULL,
    mobile = NULL,
    notes = NULL
  WHERE company_id = p_company_id;
  GET DIAGNOSTICS v_contacts_count = ROW_COUNT;
  
  UPDATE interactions SET
    resumo = 'Conteúdo removido por LGPD',
    content = 'Conteúdo removido por LGPD'
  WHERE company_id = p_company_id AND (resumo IS NOT NULL OR content IS NOT NULL);
  GET DIAGNOSTICS v_interactions_count = ROW_COUNT;
  
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'lgpd_anonymize', 'company', p_company_id, jsonb_build_object(
    'original_name', v_company_name,
    'reason', p_reason,
    'contacts_anonymized', v_contacts_count,
    'interactions_anonymized', v_interactions_count
  ));
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', p_company_id,
    'original_name', v_company_name,
    'contacts_anonymized', v_contacts_count,
    'interactions_anonymized', v_interactions_count,
    'executed_at', NOW()
  );
END;
$function$
