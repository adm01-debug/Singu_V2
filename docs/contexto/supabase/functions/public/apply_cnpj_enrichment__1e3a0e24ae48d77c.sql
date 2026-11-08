CREATE OR REPLACE FUNCTION public.apply_cnpj_enrichment(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cnpj text;
  v_cache cnpj_cache%ROWTYPE;
  v_updates text[] := '{}';
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  -- Obter CNPJ da empresa
  SELECT REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') INTO v_cnpj FROM companies WHERE id = p_company_id;
  IF v_cnpj IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Empresa sem CNPJ');
  END IF;
  
  -- Buscar no cache
  SELECT * INTO v_cache FROM cnpj_cache WHERE cnpj = v_cnpj;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'CNPJ não encontrado no cache. Execute enriquecimento via n8n primeiro.');
  END IF;
  
  -- Aplicar dados
  UPDATE companies SET
    razao_social = COALESCE(razao_social, v_cache.razao_social),
    nome_fantasia = COALESCE(nome_fantasia, v_cache.nome_fantasia),
    uf = COALESCE(uf, v_cache.uf),
    cidade = COALESCE(cidade, v_cache.municipio),
    cep = COALESCE(cep, v_cache.cep),
    endereco = COALESCE(endereco, v_cache.logradouro || COALESCE(', ' || v_cache.numero, '')),
    bairro = COALESCE(bairro, v_cache.bairro),
    ramo_atividade = COALESCE(ramo_atividade, v_cache.cnae_descricao),
    updated_at = NOW()
  WHERE id = p_company_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', p_company_id,
    'enriched_from', v_cache.cnpj,
    'razao_social', v_cache.razao_social,
    'uf', v_cache.uf,
    'cidade', v_cache.municipio
  );
END;
$function$
