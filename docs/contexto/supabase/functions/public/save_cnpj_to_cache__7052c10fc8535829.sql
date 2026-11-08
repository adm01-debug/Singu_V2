CREATE OR REPLACE FUNCTION public.save_cnpj_to_cache(p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cnpj text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  v_cnpj := REGEXP_REPLACE(p_data->>'cnpj', '[^0-9]', '', 'g');
  
  INSERT INTO cnpj_cache (
    cnpj, razao_social, nome_fantasia, logradouro, numero, complemento,
    bairro, municipio, uf, cep, telefone, email, cnae_principal, 
    cnae_descricao, situacao, data_abertura, capital_social, porte,
    natureza_juridica, raw_data
  ) VALUES (
    v_cnpj,
    p_data->>'razao_social',
    p_data->>'nome_fantasia',
    p_data->>'logradouro',
    p_data->>'numero',
    p_data->>'complemento',
    p_data->>'bairro',
    p_data->>'municipio',
    p_data->>'uf',
    p_data->>'cep',
    p_data->>'telefone',
    p_data->>'email',
    p_data->>'cnae_fiscal',
    p_data->>'cnae_fiscal_descricao',
    p_data->>'situacao_cadastral',
    (p_data->>'data_inicio_atividade')::date,
    (p_data->>'capital_social')::numeric,
    p_data->>'porte',
    p_data->>'natureza_juridica',
    p_data
  )
  ON CONFLICT (cnpj) DO UPDATE SET
    razao_social = EXCLUDED.razao_social,
    nome_fantasia = EXCLUDED.nome_fantasia,
    uf = EXCLUDED.uf,
    municipio = EXCLUDED.municipio,
    consulted_at = NOW(),
    raw_data = EXCLUDED.raw_data;
  
  RETURN jsonb_build_object('success', true, 'cnpj', v_cnpj);
END;
$function$
