CREATE OR REPLACE FUNCTION public.import_companies_batch(p_data jsonb, p_user_id uuid DEFAULT auth.uid(), p_skip_duplicates boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row jsonb;
  v_validation jsonb;
  v_imported int := 0;
  v_skipped int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_cnpj text;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    v_validation := validate_import_row(v_row);
    
    IF NOT (v_validation->>'valid')::boolean THEN
      v_errors := v_errors || jsonb_build_object(
        'row', v_row,
        'errors', v_validation->'errors'
      );
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;
    
    v_cnpj := regexp_replace(COALESCE(v_row->>'cnpj', ''), '[^0-9]', '', 'g');
    
    IF v_cnpj != '' AND EXISTS (SELECT 1 FROM companies WHERE cnpj = v_cnpj) THEN
      IF p_skip_duplicates THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
    END IF;
    
    INSERT INTO companies (
      nome_fantasia, nome_crm, razao_social, cnpj, email, phone, 
      ramo_atividade, source, state, city, status, user_id
    )
    VALUES (
      COALESCE(v_row->>'trade_name', v_row->>'nome_fantasia'),
      COALESCE(v_row->>'trade_name', v_row->>'nome_crm'),
      COALESCE(v_row->>'legal_name', v_row->>'razao_social'),
      NULLIF(v_cnpj, ''),
      v_row->>'email',
      v_row->>'phone',
      COALESCE(v_row->>'segment', v_row->>'ramo_atividade'),
      COALESCE(v_row->>'source', 'import'),
      v_row->>'state',
      v_row->>'city',
      'ativo',
      p_user_id
    );
    v_imported := v_imported + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'imported', v_imported,
    'skipped', v_skipped,
    'errors', v_errors,
    'total', jsonb_array_length(p_data)
  );
END;
$function$
