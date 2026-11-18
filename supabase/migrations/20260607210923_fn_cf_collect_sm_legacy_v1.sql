-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260607210923
-- nome:   fn_cf_collect_sm_legacy_v1

CREATE OR REPLACE FUNCTION fn_cf_collect_sm_legacy(
  p_start_page integer DEFAULT 420,
  p_end_page integer DEFAULT 465
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_creds jsonb;
  v_token text;
  v_account_id text;
  v_page integer;
  v_url text;
  v_resp_body jsonb;
  v_resp_status integer;
  v_images_count integer;
  v_sm_count integer;
  v_inserted_total integer := 0;
  v_pages_with_sm integer := 0;
  v_pages_no_sm_consecutive integer := 0;
  v_pages_scanned integer := 0;
  v_first_sm_page integer := NULL;
  v_last_sm_page integer := NULL;
BEGIN
  -- Get credentials
  v_creds := fn_get_cf_credentials();
  v_account_id := v_creds->>'account_id';
  v_token := v_creds->>'api_token';
  
  IF v_token IS NULL OR v_account_id IS NULL THEN
    RAISE EXCEPTION 'CF credentials not found in vault';
  END IF;
  
  FOR v_page IN p_start_page..p_end_page LOOP
    v_url := format(
      'https://api.cloudflare.com/client/v4/accounts/%s/images/v1?page=%s&per_page=100&sort_order=asc',
      v_account_id, v_page
    );
    
    BEGIN
      SELECT 
        (response.content::jsonb)->'result',
        response.status
      INTO v_resp_body, v_resp_status
      FROM extensions.http((
        'GET',
        v_url,
        ARRAY[
          extensions.http_header('Authorization', 'Bearer ' || v_token),
          extensions.http_header('Content-Type', 'application/json')
        ],
        NULL,
        NULL
      )::extensions.http_request) AS response;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error on page %: %', v_page, SQLERRM;
      CONTINUE;
    END;
    
    v_pages_scanned := v_pages_scanned + 1;
    
    IF v_resp_status != 200 THEN
      RAISE NOTICE 'Page % returned status %', v_page, v_resp_status;
      CONTINUE;
    END IF;
    
    -- Insert all sm-* images from this page
    WITH inserted AS (
      INSERT INTO cf_sm_legacy (cf_id, filename, uploaded_at)
      SELECT 
        img->>'id',
        img->>'filename',
        (img->>'uploaded')::timestamptz
      FROM jsonb_array_elements(v_resp_body->'images') AS img
      WHERE img->>'id' LIKE 'sm-%'
      ON CONFLICT (cf_id) DO NOTHING
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_sm_count FROM inserted;
    
    -- Count total images in this page for diagnostics
    SELECT jsonb_array_length(v_resp_body->'images') INTO v_images_count;
    
    v_inserted_total := v_inserted_total + v_sm_count;
    
    IF v_sm_count > 0 THEN
      v_pages_with_sm := v_pages_with_sm + 1;
      IF v_first_sm_page IS NULL THEN v_first_sm_page := v_page; END IF;
      v_last_sm_page := v_page;
      v_pages_no_sm_consecutive := 0;
    ELSE
      -- Conta páginas consecutivas SEM SM. Se já achei SM antes e agora tenho 3 páginas sem SM, parar.
      IF v_first_sm_page IS NOT NULL THEN
        v_pages_no_sm_consecutive := v_pages_no_sm_consecutive + 1;
        IF v_pages_no_sm_consecutive >= 3 THEN
          RAISE NOTICE 'Stopping at page % — 3 consecutive pages without SM after last SM page %', v_page, v_last_sm_page;
          EXIT;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'pages_scanned', v_pages_scanned,
    'pages_with_sm', v_pages_with_sm,
    'first_sm_page', v_first_sm_page,
    'last_sm_page', v_last_sm_page,
    'inserted_total', v_inserted_total,
    'cf_sm_legacy_count_after', (SELECT COUNT(*) FROM cf_sm_legacy)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_cf_collect_sm_legacy(integer, integer) TO service_role;
