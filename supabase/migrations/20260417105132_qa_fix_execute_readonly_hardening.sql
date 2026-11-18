-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417105132
-- nome:   qa_fix_execute_readonly_hardening

-- ============================================================================
-- QA FIX: execute_readonly_query — bloquear DoS attacks (pg_sleep, generate_series 
-- abusivo, lo_*, dblink, large_object) e adicionar statement_timeout
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '5s'  -- HARD LIMIT: max 5s para qualquer query
SET lock_timeout TO '2s'
AS $$
DECLARE
  result json;
  upper_query text;
  lower_query text;
BEGIN
  upper_query := upper(trim(query_text));
  lower_query := lower(trim(query_text));
  
  -- Deve começar com SELECT
  IF NOT (upper_query LIKE 'SELECT%' OR upper_query LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT/WITH queries are allowed';
  END IF;
  
  -- Proibir palavras-chave DML/DDL
  IF upper_query ~ '(\mINSERT\M|\mUPDATE\M|\mDELETE\M|\mDROP\M|\mALTER\M|\mCREATE\M|\mTRUNCATE\M|\mGRANT\M|\mREVOKE\M|\mEXECUTE\M|\mCOPY\M|\mVACUUM\M|\mANALYZE\M|\mREINDEX\M|\mREFRESH\M|\mLISTEN\M|\mNOTIFY\M|\mLOCK\M|\mINTO\M)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  
  -- Proibir schemas de sistema
  IF lower_query ~ '(auth\.|pg_catalog|pg_toast|pg_temp|information_schema|supabase_)' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;

  -- Proibir funções perigosas (DoS, I/O, filesystem, networking)
  IF lower_query ~ '(pg_sleep|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|dblink|lo_import|lo_export|lo_create|lo_unlink|pg_reload|pg_terminate|pg_cancel|copy_to|copy_from|set_config|current_setting)' THEN
    RAISE EXCEPTION 'Query contains forbidden functions (DoS/IO/network/system)';
  END IF;

  -- Proibir subquery gigantes via generate_series com N alto
  IF lower_query ~ 'generate_series\s*\([^,)]*,\s*[0-9]{6,}' THEN
    RAISE EXCEPTION 'generate_series with large upper bound not allowed';
  END IF;

  -- Tamanho máximo da query
  IF length(query_text) > 5000 THEN
    RAISE EXCEPTION 'Query exceeds 5000 chars limit';
  END IF;

  -- Executar com LIMIT implícito adicionado se não tiver
  EXECUTE 'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query_text || ') t'
    INTO result;

  -- Limitar tamanho do resultado (max 10MB)
  IF length(result::text) > 10 * 1024 * 1024 THEN
    RAISE EXCEPTION 'Result exceeds 10MB limit';
  END IF;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.execute_readonly_query(text) IS 'QA-hardened: statement_timeout 5s, bloqueia pg_sleep/dblink/lo_*/pg_read_file, limita tamanho de query e resultado. SECURITY DEFINER mas com proteção multicamada.';
